const dbHandler = require("../db-handler");
const { setupTestApp } = require("../test-server");
const DITokens = require("../../container.tokens");
const { AppConstants } = require("../../server.constants");
const { CameraStream } = require("../../models/CameraStream");
const { expectOkResponse } = require("../extensions");
let Model = CameraStream;

const listRoute = `${AppConstants.apiRoute}/camera-stream`;
const getRoute = (id) => `${listRoute}/${id}`;
const deleteRoute = (id) => `${listRoute}/${id}`;
const updateRoute = (id) => `${getRoute(id)}`;

let request;
let container;
let printerSocketStore;
beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
  printerSocketStore = container.resolve(DITokens.printerSocketStore);
});

beforeEach(async () => {
  Model.deleteMany({});
});

describe("CameraStreamController", () => {
  const defaultSettings = {
    flipHorizontal: false,
    flipVertical: false,
    aspectRatio: "16:9",
    rotationClockwise: 0,
  };
  const defaultTestURL = "https://test.url/stream";
  const defaultCameraStreamInput = {
    streamURL: defaultTestURL,
    printerId: null,
    settings: defaultSettings,
  };
  const createTestCameraStream = async () => await request.post(listRoute).send(defaultCameraStreamInput);
  const deleteTestCameraStream = async (id) => await request.delete(deleteRoute(id));

  it("should list streams", async () => {
    const res = await request.get(listRoute);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });

  it("should create stream", async () => {
    const res = await createTestCameraStream();
    expectOkResponse(res.statusCode, {
      _id: expect.any(String),
      __v: 0,
      streamURL: defaultTestURL,
      printerId: null,
      settings: defaultSettings,
    });
  });

  it("should create and delete stream", async () => {
    const res = await createTestCameraStream();
    await expectOkResponse(res, {
      _id: expect.any(String),
      __v: 0,
      streamURL: defaultTestURL,
      printerId: null,
      settings: defaultSettings,
    });
    const deleteResponse = await deleteTestCameraStream(res.body._id);
    await expectOkResponse(deleteResponse);
  });
});
