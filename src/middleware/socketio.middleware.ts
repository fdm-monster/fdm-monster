import { SettingsStore } from "@/state/settings.store";
import { Strategy as PassportJwtStrategy, StrategyOptionsWithoutRequest, VerifyCallback } from "passport-jwt";
import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { ExtendedError } from "socket.io/dist/namespace";
import { LoggerService } from "@/handlers/logger";
import { User } from "@/entities";

export const authorize = (
  settingsStore: SettingsStore,
  options: StrategyOptionsWithoutRequest,
  logger: LoggerService,
  verify: VerifyCallback,
) => {
  const strategy = new PassportJwtStrategy(options, verify);

  return async function authorizeCallback(
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
    next: (err?: ExtendedError) => void,
  ) {
    if (!(await settingsStore.getLoginRequired())) {
      // No login required, so we can skip the authentication
      return next();
    }
    // --- Begin strategy augmentation like passport
    strategy.success = function success(_user: User) {
      // When SocketIO gateway requires user, we can provide it as such:
      // socket.handshake.user = user;
      next();
    };
    strategy.fail = (info) => {
      logger.warn(`Failure authenticating SocketIO user, reason: '${info}'`, { reason: info });
      next(new Error(info));
    };
    strategy.error = (error) => {
      logger.warn("Error authenticating SocketIO user");
      next(error);
    };

    strategy.authenticate(socket as any, {} as VerifyCallback);
  };
};
