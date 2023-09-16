const { RefreshToken } = require("../../models/Auth/RefreshToken");
const { AuthenticationError } = require("../../exceptions/runtime.exceptions");
const { comparePasswordHash } = require("../../utils/crypto.utils");
const { v4: uuidv4 } = require("uuid");
const { AppConstants } = require("../../server.constants");

export class AuthService {
  /**
   * @type {LoggerService}
   */
  logger;
  /**
   * @private
   */
  RefreshTokenModel = RefreshToken;
  /**
   * @private
   * @type {UserService}
   */
  userService;
  /**
   * @private
   * @type {JwtService}
   */
  jwtService;
  /**
   * @private
   * @type {SettingsStore}
   */
  settingsStore;
  /**
   *  When users are blacklisted at runtime, this cache can make quick work of rejecting them
   * @private
   * @type {{}}
   */
  blacklistedCache = {};

  /**
   * loginUser: starts new session: id-token, refresh, removing any old refresh
   * logoutUser: ends session, removes refresh token and blacklists userId
   * renewLoginByRefreshToken: renews session, reduces refresh attempts
   * addBlackListEntry: private, adds a blacklisted entry after logout
   * removeBlacklistEntry: private, removes a blacklisted entry
   * logoutUser
   * signJwtToken: private, purely signs a new jwt token
   */

  /**
   * cool features: faking other user logins (encapsulated login? Double login?)
   * registration link
   * loginUser: username/password based login
   * blacklist: forcing all existing refresh tokens and jwts to be rejected of that user until login
   * refreshAttempts => integer in setting with cap?
   */

  constructor({ userService, jwtService, loggerFactory, settingsStore }) {
    this.userService = userService;
    this.jwtService = jwtService;
    this.logger = loggerFactory(AuthService.name);
    this.settingsStore = settingsStore;
  }

  async loginUser(username, password) {
    const userDoc = await this.userService.findRawByUsername(username);
    if (!userDoc) {
      throw new AuthenticationError("Login incorrect");
    }
    const result = comparePasswordHash(password, userDoc.passwordHash);
    if (!result) {
      throw new AuthenticationError("Login incorrect");
    }

    const userId = userDoc.id.toString();
    const token = await this.signJwtToken(userId);
    this.removeBlacklistEntry(userId);
    await this.deleteRefreshTokenByUserId(userId);
    const refreshToken = await this.createRefreshToken(userId);

    return {
      token,
      refreshToken,
    };
  }

  async logoutUserId(userId) {
    await this.deleteRefreshTokenAndBlacklistUserId(userId);
  }

  async logoutUserRefreshToken(refreshToken) {
    const userRefreshToken = await this.getValidRefreshToken(refreshToken);
    await this.deleteRefreshTokenAndBlacklistUserId(userRefreshToken.userId);
  }

  async renewLoginByRefreshToken(refreshToken) {
    const userRefreshToken = await this.getValidRefreshToken(refreshToken, false);
    if (!userRefreshToken) {
      throw new AuthenticationError("The refresh token was invalid or expired, could not refresh user token");
    }

    const userId = userRefreshToken.userId;
    await this.increaseRefreshTokenAttemptsUsed(userRefreshToken.refreshToken);
    return this.signJwtToken(userId);
  }

  /**
   * @private
   * @param {string} userId
   * @returns {Promise<string>}
   */
  async signJwtToken(userId) {
    const user = await this.userService.getUser(userId);
    return this.jwtService.signJwtToken(userId, user.username);
  }

  /**
   * @private
   * @param userId
   * @return {Promise<string>}
   */
  async createRefreshToken(userId) {
    const { refreshTokenExpiry } = await this.settingsStore.getCredentialSettings();
    const refreshToken = uuidv4();

    if (!refreshTokenExpiry) {
      this.logger.warn("Refresh token expiry not set in ServerSettings:credentials, using default");
    }

    const timespan = refreshTokenExpiry ?? AppConstants.DEFAULT_REFRESH_TOKEN_EXPIRY;
    await this.RefreshTokenModel.create({
      userId,
      expiresAt: Date.now() + timespan,
      refreshToken,
      refreshAttemptsUsed: 0,
    });

    return refreshToken;
  }

  /**
   * @private
   * @param {string} refreshToken
   * @param {boolean} throwNotFoundError throws when refresh token expired
   * @returns {Promise<RefreshToken|null>}
   */
  async getValidRefreshToken(refreshToken, throwNotFoundError = true) {
    const userRefreshToken = await this.RefreshTokenModel.findOne({
      refreshToken,
    });
    if (!userRefreshToken) {
      if (throwNotFoundError) {
        throw new AuthenticationError("The refresh token was not found");
      }
      return null;
    }

    if (Date.now() > userRefreshToken.expiresAt) {
      await this.deleteRefreshTokenAndBlacklistUserId(userRefreshToken.userId);
      throw new AuthenticationError("Refresh token expired, login required");
    }
    return userRefreshToken;
  }

  /**
   * @private
   * @param refreshToken
   * @return {Promise<void>}
   */
  async increaseRefreshTokenAttemptsUsed(refreshToken) {
    const { refreshTokenAttempts } = await this.settingsStore.getCredentialSettings();
    const userRefreshToken = await this.getValidRefreshToken(refreshToken);

    // If no attempts are set, then we don't care about attempts
    if (refreshTokenAttempts < 0) return;

    const attemptsUsed = userRefreshToken.refreshAttemptsUsed;
    if (attemptsUsed >= refreshTokenAttempts) {
      await this.deleteRefreshTokenAndBlacklistUserId(userRefreshToken.userId);
      throw new AuthenticationError("Refresh token attempts exceeded, login required");
    }

    const result = await this.RefreshTokenModel.findOneAndUpdate(
      {
        refreshToken,
      },
      {
        refreshAttemptsUsed: attemptsUsed + 1,
      },
      {
        new: true,
      }
    );
    return result;
  }

  /**
   * @private
   * @param {string} userId
   * @return {Promise<void>}
   */
  async deleteRefreshTokenAndBlacklistUserId(userId) {
    if (!userId) {
      throw new AuthenticationError("No user id provided");
    }
    if (this.isBlacklisted(userId)) {
      throw new AuthenticationError("User is blacklisted, please login again");
    }

    await this.deleteRefreshTokenByUserId(userId);
    this.addBlackListEntry(userId);
  }

  /**
   * @private
   * @param userId
   * @return {Promise<void>}
   */
  async deleteRefreshTokenByUserId(userId) {
    const result = await this.RefreshTokenModel.deleteMany({
      userId,
    });

    if (result.rowsAffected) {
      this.logger.debug(`Removed ${result.rowsAffected} login refresh tokens`);
    }
  }

  /**
   * @private
   * @param refreshToken
   * @return {Promise<void>}
   */
  async deleteRefreshToken(refreshToken) {
    const result = await this.RefreshTokenModel.deleteOne({
      refreshToken,
    });

    // TODO audit result
    if (result.rowsAffected) {
      this.logger.debug(`Removed ${result.rowsAffected} login refresh tokens`);
    }
  }

  isBlacklisted(userId) {
    return this.blacklistedCache[userId] === true;
  }

  /**
   * @private
   * @param {string} userId
   */
  addBlackListEntry(userId) {
    this.blacklistedCache[userId] = true;
  }

  /**
   * @private
   * @param userId
   */
  removeBlacklistEntry(userId) {
    delete this.blacklistedCache[userId];
  }
}

module.exports = {
  AuthService,
};
