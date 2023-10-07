import { connect } from "../db-handler";
import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { CameraStream as Model } from "@/models";
import supertest from "supertest";
import { createTestPrinter } from "./test-data/create-printer";
import { CameraStreamController } from "@/controllers/camera-stream.controller";

const listRoute = `${AppConstants.apiRoute}/camera-stream`;
const getRoute = (id: string) => `${listRoute}/${id}`;
const deleteRoute = (id: string) => `${listRoute}/${id}`;
const updateRoute = (id: string) => `${getRoute(id)}`;

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  await connect();
  ({ request } = await setupTestApp(true));
});

beforeEach(async () => {
  Model.deleteMany({});
});

describe(CameraStreamController.name, () => {
  const defaultSettings = {
    flipHorizontal: false,
    flipVertical: false,
    aspectRatio: "16:9",
    rotationClockwise: 0,
  };
  const defaultTestURL = "https://test.url/stream";
  const defaultCameraStreamInput = (url: string) => ({
    streamURL: url,
    printerId: null,
    settings: defaultSettings,
  });
  const matchedBody = (url: string) => ({
    id: expect.any(String),
    streamURL: url,
    printerId: null,
    settings: defaultSettings,
  });
  const getTestCameraStream = async (id: string) => await request.get(getRoute(id));
  const createTestCameraStream = async (url: string) => await request.post(listRoute).send(defaultCameraStreamInput(url));
  const deleteTestCameraStream = async (id: string) => await request.delete(deleteRoute(id));
  const updateTestCameraStream = async (id: string, url: string, printerId: string | null) =>
    await request.put(updateRoute(id)).send(defaultCameraStreamInput(url));

  it("should list streams", async () => {
    const res = await request.get(listRoute);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });

  it("should create stream", async () => {
    const res = await createTestCameraStream(defaultTestURL);
    expectOkResponse(res, matchedBody(defaultTestURL));
    expectOkResponse(await getTestCameraStream(res.body.id), matchedBody(defaultTestURL));
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
    const deleteResponse = await deleteTestCameraStream(res.body.id);
    await expectOkResponse(deleteResponse);
  });

  it("should create and update stream", async () => {
    const res = await createTestCameraStream(defaultTestURL + "5");
    await expectOkResponse(res, matchedBody(defaultTestURL + "5"));
    const printer = await createTestPrinter(request, true);
    const updateResponse = await updateTestCameraStream(res.body.id, defaultTestURL + "6", printer.id);
    await expectOkResponse(updateResponse);
  });
});
