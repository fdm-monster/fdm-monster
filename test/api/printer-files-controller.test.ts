import { setupTestApp } from "../test-server";
import { createTestPrinter } from "./test-data/create-printer";
import { expectInvalidResponse, expectNotFoundResponse, expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { Printer } from "@/models";
import nock from "nock";
import supertest from "supertest";
import { connect } from "../db-handler";
import { OctoPrintApiMock } from "../mocks/octoprint-api.mock";
import { PrinterFilesController } from "@/controllers/printer-files.controller";

const defaultRoute = AppConstants.apiRoute + "/printer-files";
const trackedUploadsRoute = `${defaultRoute}/tracked-uploads`;
const purgeIndexedFilesRoute = `${defaultRoute}/purge`;
const batchReprintRoute = `${defaultRoute}/batch/reprint-files`;
const getRoute = (id: string) => `${defaultRoute}/${id}`;
const clearFilesRoute = (id: string) => `${getRoute(id)}/clear`;
const moveFileOrFolderRoute = (id: string) => `${getRoute(id)}/move`;
const deleteFileOrFolderRoute = (id: string, path: string) => `${getRoute(id)}?path=${path}`;
const selectAndPrintRoute = (id: string) => `${getRoute(id)}/select`;
const uploadFileRoute = (id: string) => `${getRoute(id)}/upload`;
const createFolderRoute = (id: string) => `${getRoute(id)}/create-folder`;
const getFilesRoute = (id: string, recursive: boolean) => `${getRoute(id)}?recursive=${recursive}`;
const getCacheRoute = (id: string) => `${getRoute(id)}/cache`;

let request: supertest.SuperTest<supertest.Test>;
let octoPrintApiService: OctoPrintApiMock;

beforeAll(async () => {
  await connect();
  ({ request, octoPrintApiService } = await setupTestApp(true));
});

beforeEach(async () => {
  Printer.deleteMany({});
  octoPrintApiService.storeResponse(undefined, undefined);
});

describe(PrinterFilesController.name, () => {
  const gcodePath = "test/api/test-data/sample.gcode";
  const invalidGcodePath = "test/api/test-data/sample.gco";

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
    octoPrintApiService.storeResponse({ files: [], free: 1, total: 1 }, 200);
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

    const apiMock = nock(printer.printerURL);
    apiMock.post("/api/files/local").reply(200, {
      files: {
        local: {
          path: "file.gcode",
          name: "file.gcode",
        },
      },
    });
    octoPrintApiService.storeResponse(
      {
        DisplayLayerProgress: {
          totalLayerCountWithoutOffset: "19",
        },
        date: 1689190590,
        display: "file.gcode",
        gcodeAnalysis: {
          analysisFirstFilamentPrintTime: 11.23491561690389,
          analysisLastFilamentPrintTime: 7657.739990697696,
          analysisPending: false,
          analysisPrintTime: 7664.035725705694,
          compensatedPrintTime: 7811.063505072208,
          dimensions: {
            depth: 171.8769989013672,
            height: 3.799999952316284,
            width: 128.8769989013672,
          },
          estimatedPrintTime: 7811.063505072208,
          filament: {
            tool0: {
              length: 12463.312793658377,
              volume: 29.977780370085828,
            },
          },
          firstFilament: 0.00556784805395266,
          lastFilament: 0.9944192313637905,
          printingArea: {
            maxX: 188.8769989013672,
            maxY: 168.8769989013672,
            maxZ: 3.799999952316284,
            minX: 60.0,
            minY: -3.0,
            minZ: 0,
          },
          progress: [
            [0, 7811.063505072208],
            // ...
            [0.9882939524753298, 77.78355728284184],
            [0.9934423430553024, 17.78153162482447],
            [0.9944192313637905, 7.3489461642040395],
            [1, 0],
          ],
        },
        hash: "a791a7c44a92e4c46827992a1c5a62281e5a2d13",
        name: "file.gcode",
        origin: "local",
        path: gcodePath,
        prints: {
          failure: 0,
          last: {
            date: 1689197785.1172757,
            printTime: 7194.159933987998,
            success: true,
          },
          success: 1,
        },
        refs: {
          download: "http://minipi.local/downloads/files/local/file.gcode",
          resource: "http://minipi.local/api/files/local/file.gcode",
        },
        size: 2167085,
        statistics: {
          averagePrintTime: {
            _default: 7194.159933987998,
          },
          lastPrintTime: {
            _default: 7194.159933987998,
          },
        },
        thumbnail: "plugin/prusaslicerthumbnails/thumbnail/file.png?20230712213630",
        thumbnail_src: "prusaslicerthumbnails",
        type: "machinecode",
        typePath: ["machinecode", "gcode"],
      },

      200
    );

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
            hash: "123",
            origin: "local",
            display: "123",
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
            hash: "123",
            origin: "local",
            display: "123",
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
});
