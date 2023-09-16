const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { Strategy: AnonymousStrategy } = require("passport-anonymous");
const User = require("../models/Auth/User.js");
const { DITokens } = require("../container.tokens");
const { AppConstants } = require("../server.constants");

/**
 * @param {Authenticator} passport
 * @param {AwilixContainer<any>} container
 * @returns {Authenticator}
 */
function initializePassportStrategies(passport, container) {
  const opts = {};
  /** @type {SettingsStore} **/
  const settingsStore = container.resolve(DITokens.settingsStore);
  const configService = container.resolve(DITokens.configService);
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKeyProvider = async (req, token, done) => {
    const { jwtSecret } = await settingsStore.getCredentialSettings();
    return done(null, jwtSecret);
  };
  opts.audience = configService.get(AppConstants.OVERRIDE_JWT_AUDIENCE, AppConstants.DEFAULT_JWT_AUDIENCE);
  opts.issuer = configService.get(AppConstants.OVERRIDE_JWT_ISSUER, AppConstants.DEFAULT_JWT_ISSUER);

  passport.use(
    new JwtStrategy(opts, function (jwt_payload, done) {
      User.findOne({ id: jwt_payload.sub }, function (err, user) {
        if (err) {
          return done(err, false);
        }
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      });
    })
  );
  passport.use(new AnonymousStrategy());
  return passport;
}

module.exports = {
  initializePassportStrategies,
};
