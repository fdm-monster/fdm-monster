const dbHandler = require("../db-handler");
const { configureContainer } = require("../../server/container");
const DITokens = require("../../server/container.tokens");
const UserModel = require("../../server/models/Auth/User");
const { ROLES } = require("../../server/constants/service.constants");
const { ensureTestUserCreated } = require("../api/test-data/create-user");

let container;
let userService;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  userService = container.resolve(DITokens.userService);
});
afterEach(async () => {
  await UserModel.deleteMany();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("UserService", () => {
  it("should get user ", async () => {
    const { id } = await ensureTestUserCreated();
    await userService.getUser(id);
  });
});
