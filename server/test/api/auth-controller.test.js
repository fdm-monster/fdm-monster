import * as dbHandler from "../db-handler.js";
import { AppConstants } from "../../server.constants";
import testServer from "../test-server.js";
import extensions from "../extensions.js";
import createUser from "./test-data/create-user.js";
import DITokens from "../../container.tokens";
const { setupTestApp } = testServer;
const { expectOkResponse, expectInvalidResponse, expectUnauthorizedResponse, expectInternalServerError } = extensions;
const { getUserData, ensureTestUserCreated } = createUser;
let request;
let container;
const baseRoute = AppConstants.apiRoute + "/auth";
const loginRoute = `${baseRoute}/login`;
const registerRoute = `${baseRoute}/register`;
const logoutRoute = `${baseRoute}/logout`;
beforeAll(async () => {
    await dbHandler.connect();
    ({ request, container } = await setupTestApp(true));
});
describe("AuthController", () => {
    it("should fail login without creds", async () => {
        const response = await request.post(loginRoute).send();
        expectInvalidResponse(response);
    });
    it("should not authorize unknown credentials", async () => {
        const response = await request.post(loginRoute).send({ username: "test", password: "test" });
        expectUnauthorizedResponse(response);
    });
    it("should register new user", async () => {
        const password = "registeredPassword";
        const { username, name } = getUserData("default1", password);
        const response = await request.post(registerRoute).send({
            username,
            name,
            password,
            password2: password
        });
        expectOkResponse(response);
    });
    it("should fail new user registration when server:registration is disabled", async () => {
        await container.resolve(DITokens.settingsStore).setRegistrationEnabled(false);
        const response = await request.post(registerRoute).send();
        expectInternalServerError(response);
    });
    it("should authorize known user", async () => {
        const password = "newPassword";
        const { username } = await ensureTestUserCreated("default", password);
        const response = await request.post(loginRoute).send({ username, password });
        expectOkResponse(response);
    });
    it("should succeed logout", async () => {
        const response = await request.post(logoutRoute).send();
        expectOkResponse(response);
    });
});
