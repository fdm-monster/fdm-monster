import { ExtractJwt, JwtFromRequestFunction, Strategy as JwtStrategy, StrategyOptions, VerifiedCallback } from "passport-jwt";
import { Strategy as AnonymousStrategy } from "passport-anonymous";
import { DITokens } from "@/container.tokens";
import { AppConstants } from "@/server.constants";
import { AwilixContainer } from "awilix";
import { PassportStatic } from "passport";
import { SettingsStore } from "@/state/settings.store";
import { ConfigService } from "@/services/core/config.service";
import { IUser } from "@/models/Auth/User";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { Socket } from "socket.io";
import { AuthenticationError } from "@/exceptions/runtime.exceptions";
import { AUTH_ERROR_REASON } from "@/constants/authorization.constants";
import { User } from "@/entities";

export interface JwtFromSocketFunction {
  (socket: Socket): string | null;
}

export function getPassportJwtOptions(
  settingsStore: SettingsStore,
  configService: ConfigService,
  jwtFromRequest: JwtFromRequestFunction | JwtFromSocketFunction = ExtractJwt.fromAuthHeaderAsBearerToken()
): StrategyOptions {
  return {
    jwtFromRequest: jwtFromRequest,
    secretOrKeyProvider: async (req, token: string, done) => {
      const { jwtSecret } = await settingsStore.getCredentialSettings();
      return done(null, jwtSecret);
    },
    audience: configService.get(AppConstants.OVERRIDE_JWT_AUDIENCE, AppConstants.DEFAULT_JWT_AUDIENCE),
    issuer: configService.get(AppConstants.OVERRIDE_JWT_ISSUER, AppConstants.DEFAULT_JWT_ISSUER),
  } as StrategyOptions;
}

export function verifyUserCallback(userService: IUserService) {
  return function (jwt_payload: any, done: VerifiedCallback) {
    userService
      .getUser(jwt_payload.userId)
      .then((user: IUser | User) => {
        if (user && user.isVerified && !user.needsPasswordChange) {
          return done(null, user);
        }
        if (user && user.needsPasswordChange) {
          console.log("Needs password change");
          return done(new AuthenticationError("Password change required", AUTH_ERROR_REASON.PasswordChangeRequired), false);
        }
        if (user && !user?.isVerified) {
          console.log("Needs password change");
          return done(new AuthenticationError("User not verified", AUTH_ERROR_REASON.AccountNotVerified), false);
        }

        return done(null, false);
      })
      .catch((err) => {
        if (err) {
          return done(err, false);
        }
      });
  };
}

export function initializePassportStrategies(passport: PassportStatic, container: AwilixContainer<any>): PassportStatic {
  const settingsStore = container.resolve<SettingsStore>(DITokens.settingsStore);
  const configService = container.resolve<ConfigService>(DITokens.configService);
  const userService = container.resolve<IUserService>(DITokens.userService);

  const opts = getPassportJwtOptions(settingsStore, configService, ExtractJwt.fromAuthHeaderAsBearerToken());

  passport.use(
    new JwtStrategy(opts, function (jwt_payload, done) {
      verifyUserCallback(userService)(jwt_payload, done);
    })
  );
  passport.use(new AnonymousStrategy());
  return passport;
}
