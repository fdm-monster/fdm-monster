import {
  ExtractJwt,
  JwtFromRequestFunction,
  Strategy as JwtStrategy,
  StrategyOptionsWithoutRequest,
  VerifiedCallback,
} from "passport-jwt";
import { Strategy as AnonymousStrategy } from "passport-anonymous";
import { DITokens } from "@/container.tokens";
import { AppConstants } from "@/server.constants";
import { AwilixContainer } from "awilix";
import { PassportStatic } from "passport";
import { SettingsStore } from "@/state/settings.store";
import { ConfigService } from "@/services/core/config.service";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { Socket } from "socket.io";
import { AuthenticationError } from "@/exceptions/runtime.exceptions";
import { AUTH_ERROR_REASON } from "@/constants/authorization.constants";
import { User } from "@/entities";

export type JwtFromSocketFunction = (socket: Socket) => string | null;

export function getPassportJwtOptions(
  settingsStore: SettingsStore,
  configService: ConfigService,
  jwtFromRequest: JwtFromRequestFunction | JwtFromSocketFunction = ExtractJwt.fromAuthHeaderAsBearerToken(),
): StrategyOptionsWithoutRequest {
  return {
    jwtFromRequest: jwtFromRequest,
    secretOrKeyProvider: async (_req, _token: string, done) => {
      const { jwtSecret } = await settingsStore.getCredentialSettings();
      return done(null, jwtSecret);
    },
    audience: configService.get(AppConstants.OVERRIDE_JWT_AUDIENCE, AppConstants.DEFAULT_JWT_AUDIENCE),
    issuer: configService.get(AppConstants.OVERRIDE_JWT_ISSUER, AppConstants.DEFAULT_JWT_ISSUER),
  };
}

export function verifyUserCallback(userService: IUserService) {
  return function (jwt_payload: any, done: VerifiedCallback) {
    userService
      .getUser(jwt_payload.userId)
      .then((user: User) => {
        if (user?.isVerified && !user.needsPasswordChange) {
          return done(null, userService.toDto(user));
        }
        if (user?.needsPasswordChange) {
          return done(
            new AuthenticationError("Password change required", AUTH_ERROR_REASON.PasswordChangeRequired),
            false,
          );
        }
        if (!user?.isVerified) {
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

export function initializePassportStrategies(passport: PassportStatic, container: AwilixContainer): PassportStatic {
  const settingsStore = container.resolve<SettingsStore>(DITokens.settingsStore);
  const configService = container.resolve<ConfigService>(DITokens.configService);
  const userService = container.resolve<IUserService>(DITokens.userService);

  const opts = getPassportJwtOptions(settingsStore, configService, ExtractJwt.fromAuthHeaderAsBearerToken());

  passport.use(
    new JwtStrategy(opts, function (jwt_payload: any, done: VerifiedCallback) {
      verifyUserCallback(userService)(jwt_payload, done);
    }),
  );
  passport.use(new AnonymousStrategy());
  return passport;
}
