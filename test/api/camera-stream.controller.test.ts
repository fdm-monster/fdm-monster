import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { Test } from "supertest";
import { CameraStreamController } from "@/controllers/camera-stream.controller";
import TestAgent from "supertest/lib/agent";

const listRoute = `${ AppConstants.apiRoute }/camera-stream`;
const getRoute = (id: number) => `${ listRoute }/${ id }`;
const deleteRoute = (id: number) => `${ listRoute }/${ id }`;
const updateRoute = (id: number) => `${ getRoute(id) }`;

let request: TestAgent<Test>;
beforeAll(async () => {
  ({request} = await setupTestApp(true));
});

describe(CameraStreamController.name, () => {
  const defaultTestURL = "https://test.url/stream";
  const defaultCameraStreamInput = (url: string) =>
    ({
      streamURL: url,
      printerId: null,
      name: "Tester",
    });
  const matchedBody = (url: string) => ({
    id: expect.any(Number),
    streamURL: url,
    name: "Tester",
    printerId: null,
  });
  const getTestCameraStream = async (id: number) => await request.get(getRoute(id));
  const createTestCameraStream = async (url: string) =>
    await request.post(listRoute).send(defaultCameraStreamInput(url));
  const deleteTestCameraStream = async (id: number) => await request.delete(deleteRoute(id));
  const updateTestCameraStream = async (id: number, url: string) =>
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
    const updateResponse = await updateTestCameraStream(res.body.id, defaultTestURL + "6");
    await expectOkResponse(updateResponse);
  });
});
