const dbHandler = require("../db-handler");
const {setupTestApp} = require("../test-server");

beforeAll(async () => {
    await dbHandler.connect();
    ({ request, octoPrintApiService } = await setupTestApp(true));
});

afterAll(async () => {
    return Model.deleteMany({});
});

describe("PrinterService", () => {
    it("Must be able to rename a printer", async () => {

    });
});