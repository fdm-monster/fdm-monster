import { beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import dbHandler = require("../db-handler");
import { setupTestApp } from "../test-server";
import { createTestPrinter } from "./test-data/create-printer";
import { expectOkResponse, expectInvalidResponse, expectNotFoundResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { Printer as Model } from "@/models";
import nock from "nock";
const defaultRoute = AppConstants.apiRoute + "/printer-files";
const trackedUploadsRoute = `${defaultRoute}/tracked-uploads`;
const purgeIndexedFilesRoute = `${defaultRoute}/purge`;
const batchReprintRoute = `${defaultRoute}/batch/reprint-files`;
const getRoute = (id) => `${defaultRoute}/${id}`;
const clearFilesRoute = (id) => `${getRoute(id)}/clear`;
const moveFileOrFolderRoute = (id) => `${getRoute(id)}/move`;
const deleteFileOrFolderRoute = (id, path) => `${getRoute(id)}?path=${path}`;
const selectAndPrintRoute = (id) => `${getRoute(id)}/select`;
const uploadFileRoute = (id) => `${getRoute(id)}/upload`;
const localUploadFileRoute = (id) => `${getRoute(id)}/local-upload`;
const createFolderRoute = (id) => `${getRoute(id)}/create-folder`;
const getFilesRoute = (id, recursive) => `${getRoute(id)}?recursive=${recursive}`;
const getCacheRoute = (id) => `${getRoute(id)}/cache`;

let request;
let octoPrintApiService;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, octoPrintApiService } = await setupTestApp(true));
});

beforeEach(async () => {
  Model.deleteMany({});
  octoPrintApiService.storeResponse(undefined, undefined);
});

describe("PrinterFilesController", () => {
  const gcodePath = "test/api/test-data/sample.gcode";
  const invalidGcodePath = "test/api/test-data/sample.gco";
  const nockResponse = {
    files: {
      local: {
        path: "/home/yes",
        name: "3xP1234A_PLA_ParelWit_1h31m.gcode",
      },
    },
  };

  it(`should return 404 on ${defaultRoute} for nonexisting printer`, async () => {
    const res = await request.get(getRoute("60ae2b760bca4f5930be3d88")).send();
    expectNotFoundResponse(res);
  });

  it(`should require 'recursive' on ${defaultRoute} for existing printer`, async () => {
    const printer = await createTestPrinter(request);
    const response = await request.get(getRoute(printer.id)).send();
    expectInvalidResponse(response, ["recursive"]);
  });

  it("should retrieve files on GET for existing printer", async () => {
    const printer = await createTestPrinter(request);
    octoPrintApiService.storeResponse([], 200);
    const response = await request.get(getFilesRoute(printer.id, false)).send();
    expectOkResponse(response, []);
  });

  it("should allow GET on printer files cache", async () => {
    const printer = await createTestPrinter(request);
    const response = await request.get(getCacheRoute(printer.id)).send();
    expectOkResponse(response);
  });

  it("should allow GET on printer files - tracked uploads", async () => {
    const response = await request.get(trackedUploadsRoute).send();
    expectOkResponse(response);
  });

  it("should allow GET on printer files - tracked uploads", async () => {
    const response = await request.get(trackedUploadsRoute).send();
    expectOkResponse(response);
  });

  it("should allow DELETE to clear printer files - with status result", async () => {
    const printer = await createTestPrinter(request);
    const jsonFile = require("./test-data/octoprint-file.data.json");
    octoPrintApiService.storeResponse({ files: [jsonFile] }, 200);
    const response = await request.delete(clearFilesRoute(printer.id)).send();
    expectOkResponse(response, {
      succeededFiles: expect.any(Array),
      failedFiles: expect.any(Array),
    });
    expect(response.body.succeededFiles).toHaveLength(1);
    expect(response.body.failedFiles).toHaveLength(0);
  });

  it("should allow POST to purge all printer files", async () => {
    await createTestPrinter(request);
    await createTestPrinter(request);
    const response = await request.post(purgeIndexedFilesRoute).send();
    expectOkResponse(response);
  });

  it("should allow POST to move a printer folder", async () => {
    const printer = await createTestPrinter(request);
    const response = await request.post(moveFileOrFolderRoute(printer.id)).send({
      filePath: "/test",
      destination: "/test2",
    });
    expectOkResponse(response);
  });

  it("should allow POST to create a printer folder", async () => {
    const printer = await createTestPrinter(request);
    const response = await request.post(createFolderRoute(printer.id)).send({
      foldername: "/test",
      path: "local",
    });
    expectOkResponse(response);
  });

  it("should allow DELETE to remove a printer file or folder", async () => {
    const printer = await createTestPrinter(request);
    const response = await request.delete(deleteFileOrFolderRoute(printer.id, "test")).send();
    expectOkResponse(response);
  });

  it("should allow POST to batch reprint many printer files", async () => {
    const printer = await createTestPrinter(request);
    const printer2 = await createTestPrinter(request);
    const response = await request.post(batchReprintRoute).send({
      printerIds: [printer.id, printer2.id],
    });
    expectOkResponse(response);
  });

  it("should allow POST to select and print a printer file", async () => {
    const printer = await createTestPrinter(request);
    const response = await request.post(selectAndPrintRoute(printer.id)).send({
      filePath: "file.gcode",
      print: false,
    });
    expectOkResponse(response);
  });

  it("should allow POST upload file", async () => {
    const printer = await createTestPrinter(request);

    nock(printer.printerURL)
      .post("/api/files/local")
      .reply(200, {
        files: {
          local: {
            path: "/home/yes",
            name: "3xP1234A_PLA_ParelWit_1h31m.gcode",
          },
        },
      })
      .persist();

    const response = await request.post(uploadFileRoute(printer.id)).field("print", true).attach("file", gcodePath);
    expectOkResponse(response);
  });

  test.skip("should not allow POSTing multiple uploaded file", async () => {
    const printer = await createTestPrinter(request);

    nock(printer.printerURL)
      .post("/api/files/local")
      .reply(200, {
        files: {
          local: {
            path: "/home/yes",
            name: "3xP1234A_PLA_ParelWit_1h31m.gcode",
          },
        },
      })
      .persist();

    const response = await request
      .post(uploadFileRoute(printer.id))
      .field("print", true)
      .attach("file", gcodePath)
      .attach("file", gcodePath);
    expectInvalidResponse(response, ["error"]);
  });

  test.skip("should not allow POSTing wrong extensions", async () => {
    const printer = await createTestPrinter(request);

    nock(printer.printerURL)
      .post("/api/files/local")
      .reply(200, {
        files: {
          local: {
            path: "/home/yes",
            name: "3xP1234A_PLA_ParelWit_1h31m.gcode",
          },
        },
      })
      .persist();

    const response = await request.post(uploadFileRoute(printer.id)).field("print", true).attach("file", invalidGcodePath);
    console.log(response);
    expectInvalidResponse(response, ["error"]);
  });

  it("should deny POST to upload printer files when empty", async () => {
    const printer = await createTestPrinter(request);
    const response = await request.post(uploadFileRoute(printer.id)).send();
    expectInvalidResponse(response);
  });

  it("should error 400 on POST to upload local file being a folder", async () => {
    // We let it fail as late as possible checking the error to not be related to our API
    const printer = await createTestPrinter(request);
    octoPrintApiService.storeResponse({}, 200);
    const response = await request.post(localUploadFileRoute(printer.id)).send({
      localLocation: "node_modules",
      select: true,
      print: true,
    });

    expectInvalidResponse(response, ["localLocation"]);
  });

  it("should error 404 on POST to upload local non-existing file", async () => {
    // We let it fail as late as possible checking the error to not be related to our API
    const printer = await createTestPrinter(request);
    octoPrintApiService.storeResponse({}, 200);
    const response = await request.post(localUploadFileRoute(printer.id)).send({
      localLocation: "test-file.gcode",
      select: true,
      print: true,
    });

    expectNotFoundResponse(response);
  });
});
