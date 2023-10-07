import { ExtractJwt, Strategy as JwtStrategy, StrategyOptions } from "passport-jwt";
import { Strategy as AnonymousStrategy } from "passport-anonymous";
import { User } from "@/models";
import { DITokens } from "@/container.tokens";
import { AppConstants } from "@/server.constants";
import { AwilixContainer } from "awilix";
import { PassportStatic } from "passport";
import { SettingsStore } from "@/state/settings.store";
import { ConfigService } from "@/services/core/config.service";
import { IUser } from "@/models/Auth/User";

export function initializePassportStrategies(passport: PassportStatic, container: AwilixContainer<any>): PassportStatic {
  const settingsStore = container.resolve<SettingsStore>(DITokens.settingsStore);
  const configService = container.resolve<ConfigService>(DITokens.configService);

  const opts: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKeyProvider: async (req, token: string, done) => {
      const { jwtSecret } = await settingsStore.getCredentialSettings();
      return done(null, jwtSecret);
    },
    audience: configService.get(AppConstants.OVERRIDE_JWT_AUDIENCE, AppConstants.DEFAULT_JWT_AUDIENCE),
    issuer: configService.get(AppConstants.OVERRIDE_JWT_ISSUER, AppConstants.DEFAULT_JWT_ISSUER),
  };

  passport.use(
    new JwtStrategy(opts, function (jwt_payload, done) {
      User.findById(jwt_payload.userId, function (err: any, user: IUser) {
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
