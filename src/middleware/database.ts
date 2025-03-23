import { DITokens } from "@/container.tokens";
import { NextFunction, Request, Response } from "express";

export async function interceptDatabaseError(req: any | Request, res: Response, next: NextFunction) {
  const serverHost = req.container.resolve(DITokens.serverHost);

  const databaseReadyState = serverHost.hasConnected();
  if (databaseReadyState === 1) {
    next();
  } else {
    res.status(500);
    res.send({
      databaseReadyState: serverHost.hasConnected(),
      state: "Retrying database connection. Please contact the developer if this persists.",
    });
  }
}
