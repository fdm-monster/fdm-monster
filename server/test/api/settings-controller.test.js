const dbHandler = require("../db-handler");
const { setupTestApp } = require("../test-server");
const { AppConstants } = require("../../server.constants");
const { expectOkResponse } = require("../extensions");
const {
  printerFileCleanSettingKey,
  getDefaultPrinterFileCleanSettings,
  getDefaultSettings,
  serverSettingKey,
} = require("../../constants/server-settings.constants");

let request;
let container;

const defaultRoute = `${AppConstants.apiRoute}/settings`;
const serverRoute = `${defaultRoute}/server`;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
});

describe("SettingsController", () => {
  const newServerSettings = {
    [printerFileCleanSettingKey]: {
      autoRemoveOldFilesBeforeUpload: true,
    },
  };

  it("should OK on GET server-settings", async () => {
    const response = await request.get(serverRoute).send();
    expect(response.body).not.toBeNull();
    expect(response.body).toMatchObject(getDefaultSettings());
    expect(response.body[serverSettingKey].registration).toBeTruthy();
    expect(response.body[printerFileCleanSettingKey]).toMatchObject(
      getDefaultPrinterFileCleanSettings()
    );
    expectOkResponse(response);
  });

  it("should OK on PUT server-settings", async () => {
    const response = await request.put(serverRoute).send(newServerSettings);
    expect(response.body).not.toBeNull();
    expect(response.body).toMatchObject(newServerSettings);
    expectOkResponse(response);
  });
});
