import awilixExpress from "awilix-express";
import passport from "passport";
import runtime from "../exceptions/runtime.exceptions";
import { AppConstants } from "../server.constants";
import validators from "../handlers/validators.js";
import userController from "./validation/user-controller.validation";
const { createController } = awilixExpress;
const { InternalServerException } = runtime;
const { validateMiddleware } = validators;
const { registerUserRules } = userController;
class AuthController {
    #settingsStore;
    #userTokenService;
    #userService;
    #roleService;
    #logger;
    constructor({ settingsStore, userTokenService, userService, roleService, loggerFactory }) {
        this.#settingsStore = settingsStore;
        this.#userTokenService = userTokenService;
        this.#userService = userService;
        this.#roleService = roleService;
        this.#logger = loggerFactory("Server-API");
    }
    async login(req, res) {
        if (req.body.remember_me) {
            const token = await this.#userTokenService.issueTokenWithDone(req.user);
            res.cookie("remember_me", token, {
                path: "/",
                httpOnly: true,
                maxAge: 604800000
            });
        }
        return res.send();
    }
    logout(req, res) {
        req.logout();
        res.end();
    }
    async register(req, res) {
        let registrationEnabled = this.#settingsStore.isRegistrationEnabled();
        if (!registrationEnabled) {
            throw new InternalServerException("Registration is disabled. Cant register user");
        }
        const { name, username, password } = await validateMiddleware(req, registerUserRules);
        const roles = await this.#roleService.getDefaultRolesId();
        const result = await this.#userService.register({ name, username, password, roles });
        res.send(result);
    }
}
export default createController(AuthController)
    .prefix(AppConstants.apiRoute + "/auth")
    .post("/register", "register")
    .post("/login", "login", {
    before: [passport.authenticate("local")]
})
    .post("/logout", "logout");
