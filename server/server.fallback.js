import express from "express";
import path from "path";
import Logger from "./handlers/logger.js";
import dotenv from "dotenv";
import {AppConstants} from "./server.constants.js";
import exceptionHandler from "./middleware/exception.handler.js";

const logger = new Logger("Fallback-Server");

export function setupFallbackServer() {
    return express()
        .use(express.json())
        .use(express.urlencoded({extended: false}));
}

export function fetchServerPort() {
    dotenv.config({path: path.join(__dirname, ".env")});
    let port = process.env[AppConstants.SERVER_PORT_KEY];
    if (Number.isNaN(parseInt(port))) {
        logger.warning(`~ The ${AppConstants.SERVER_PORT_KEY} setting was not a correct port number: >= 0 and < 65536. Actual value: ${port}.`);
        // Update config immediately
        process.env[AppConstants.SERVER_PORT_KEY] = AppConstants.defaultServerPort.toString();
        port = process.env[AppConstants.SERVER_PORT_KEY];
    }
    return port;
}

export function serveNode12Fallback(app) {
    const port = fetchServerPort();
    let listenerHttpServer = app.listen(port, "0.0.0.0", () => {
        const msg = `You have an old Node version: ${process.version}. This needs to be version 14.x or higher... open our webpage at http://127.0.0.1:${port} for tips`;
        logger.info(msg);
    });
    app
        .get("*", function (req, res) {
            res.send({
                error: "You're running this server under Node 12 or older which is not supported. Please upgrade. Now."
            });
        })
        .use(exceptionHandler);
    return listenerHttpServer;
}
