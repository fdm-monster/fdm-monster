import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as AnonymousStrategy } from "passport-anonymous";
import { User } from "../models";
import { DITokens } from "../container.tokens";
import { AppConstants } from "../server.constants";
import { AwilixContainer } from "awilix";
import { PassportStatic } from "passport";

export function initializePassportStrategies(passport: PassportStatic, container: AwilixContainer<any>): PassportStatic {
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
