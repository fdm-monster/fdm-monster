import { SettingsStore } from "@/state/settings.store";
import { Strategy as PassportJwtStrategy, StrategyOptionsWithoutRequest, VerifyCallback } from "passport-jwt";
import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { ExtendedError } from "socket.io/dist/namespace";
import { IUser } from "@/models/Auth/User";

export const authorize = (
  settingsStore: SettingsStore,
  options: StrategyOptionsWithoutRequest,
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
    strategy.success = function success(_user: IUser) {
      // When SocketIO gateway requires user, we can provide it as such:
      // socket.handshake.user = user;
      next();
    };
    strategy.fail = (info) => next(new Error(info));
    strategy.error = (error) => next(error);

    strategy.authenticate(socket as any, {} as VerifyCallback);
  };
};
