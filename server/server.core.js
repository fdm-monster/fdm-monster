import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import cors from "cors";
import helmet from "helmet";
import {interceptRoles} from "./middleware/authorization.js";
import {passportFactory} from "./middleware/passport.js";
import {configureContainer} from "./container.js";
import DITokens from "./container.tokens.js";
import {AppConstants} from "./server.constants.js";
import awilixExpress from "awilix-express";

const {scopePerRequest} = awilixExpress;

export function setupNormalServer() {
    const httpServer = express();
    const container = configureContainer();
    const userTokenService = container.resolve(DITokens.userTokenService);
    passportFactory(passport, userTokenService);
    httpServer
        .use(cors({
            origin: "*",
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
        }))
        .use(helmet({
            contentSecurityPolicy: process.env[AppConstants.CONTENT_SECURITY_POLICY_ENABLED] || false
            // hsts: true
        }))
        .use(express.json({limit: "10mb"}))
        .use("/images", express.static("./images"))
        .use(cookieParser())
        .use(express.urlencoded({extended: false}))
        .use(session({
            secret: "supersecret",
            resave: true,
            saveUninitialized: true
        }))
        .use(passport.initialize())
        .use(passport.session())
        .use(scopePerRequest(container))
        .use(interceptRoles);
    return {
        httpServer,
        container
    };
}