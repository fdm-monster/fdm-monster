import { DITokens } from "../container.tokens";

/**
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
export async function interceptDatabaseError(req, res, next) {
  const serverHost = req.container.resolve(DITokens.serverHost);

  const databaseReadyState = serverHost.hasConnected();
  if (databaseReadyState === 1) {
    next();
  } else {
    res.status(500);
    res.send({
      databaseReadyState: serverHost.hasConnected(),
      state: "Retrying mongo connection. Please contact the developer if this persists.",
    });
  }
}
