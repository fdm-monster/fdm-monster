import dbHandler = require("../db-handler");
import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { CameraStream as Model } from "@/models";
import { beforeAll, beforeEach, describe, expect, it } from "@jest/globals";

const listRoute = `${AppConstants.apiRoute}/camera-stream`;
const getRoute = (id) => `${listRoute}/${id}`;
const deleteRoute = (id) => `${listRoute}/${id}`;
const updateRoute = (id) => `${getRoute(id)}`;

let request;
beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
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
  const defaultCameraStreamInput = (url) => ({
    streamURL: url,
    printerId: null,
    settings: defaultSettings,
  });
  const matchedBody = (url) => ({
    _id: expect.any(String),
    __v: 0,
    streamURL: url,
    printerId: null,
    settings: defaultSettings,
  });
  const createTestCameraStream = async (url) => await request.post(listRoute).send(defaultCameraStreamInput(url));
  const deleteTestCameraStream = async (id) => await request.delete(deleteRoute(id));

  it("should list streams", async () => {
    const res = await request.get(listRoute);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });

  it("should create stream", async () => {
    const res = await createTestCameraStream(defaultTestURL);
    expectOkResponse(res, matchedBody(defaultTestURL));
  });

  it("should create two streams with null printerId", async () => {
    const res = await createTestCameraStream(defaultTestURL + "2");
    expectOkResponse(res, matchedBody(defaultTestURL + "2"));
    const res2 = await createTestCameraStream(defaultTestURL + "3");
    expectOkResponse(res2, matchedBody(defaultTestURL + "3"));
  });

  it("should create and delete stream", async () => {
    const res = await createTestCameraStream(defaultTestURL + "4");
    await expectOkResponse(res, matchedBody(defaultTestURL + "4"));
    const deleteResponse = await deleteTestCameraStream(res.body._id);
    await expectOkResponse(deleteResponse);
  });
});
