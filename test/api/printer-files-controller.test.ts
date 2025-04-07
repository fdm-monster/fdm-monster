import { setupTestApp } from "../test-server";
import { createTestPrinter } from "./test-data/create-printer";
import { expectInvalidResponse, expectNotFoundResponse, expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import nock, { Body, ReplyHeaders } from "nock";
import { Test } from "supertest";
import { PrinterFilesController } from "@/controllers/printer-files.controller";
import { AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import TestAgent from "supertest/lib/agent";

const defaultRoute = AppConstants.apiRoute + "/printer-files";
const purgeIndexedFilesRoute = `${defaultRoute}/purge`;
const thumbnailsRoute = `${defaultRoute}/thumbnails`;
type idType = Number;
const getRoute = (id: idType) => `${defaultRoute}/${id}`;
const clearFilesRoute = (id: idType) => `${getRoute(id)}/clear`;
const deleteFileRoute = (id: idType, path: string) => `${getRoute(id)}?path=${path}`;
const printFileRoute = (id: idType) => `${getRoute(id)}/print`;
const reloadThumbnailRoute = (id: idType) => `${getRoute(id)}/reload-thumbnail`;
const uploadFileRoute = (id: idType) => `${getRoute(id)}/upload`;
const getFilesRoute = (id: idType) => `${getRoute(id)}`;
const downloadFileRoute = (id: idType, path: string) => `${getRoute(id)}/download/${path}`;
const getCacheRoute = (id: idType) => `${getRoute(id)}/cache`;
const getPrintThumbnailRoute = (id: idType) => `${getRoute(id)}/thumbnail`;

let request: TestAgent<Test>;
let container: AwilixContainer;
let printerService: IPrinterService;

beforeAll(async () => {
  ({ request, container } = await setupTestApp(true));
  printerService = container.resolve<IPrinterService>(DITokens.printerService);
});

beforeEach(async () => {
  const printers = await printerService.list();
  for (let printer of printers) {
    await printerService.delete(printer.id);
  }
});

describe(PrinterFilesController.name, () => {
  const gcodePath = "test/api/test-data/sample.gcode";
  const invalidGcodePath = "test/api/test-data/sample.gco";

  it(`should return 404 on ${defaultRoute} for nonexisting printer`, async () => {
    const res = await request.get(getRoute(101)).send();
    expectNotFoundResponse(res);
  });

  it("should retrieve files on GET for existing printer", async () => {
    const printer = await createTestPrinter(request);
    nock(printer.printerURL)
      .get("/api/files/local")
      .query("recursive=false")
      .reply(200, { files: [], free: 1, total: 1 });
    const response = await request.get(getFilesRoute(printer.id)).send();
    expectOkResponse(response, []);
  });

  it("should retrieve file with hash character on GET for existing printer", async () => {
    const printer = await createTestPrinter(request);
    const filename = "test#.gcode";
    const reply0 = { path: filename };
    const reply1 = JSON.stringify(reply0);
    nock(printer.printerURL)
      .get(`/downloads/files/local/${encodeURIComponent(filename)}`)
      .reply(
        200,
        reply1 as Body,
        {
          "content-type": "application/json",
          "content-length": reply1.length.toString(),
          "content-disposition": "attachment; filename=test#.gcode",
        } as ReplyHeaders,
      );
    const response = await request.get(downloadFileRoute(printer.id, encodeURIComponent(filename))).send();
    expectOkResponse(response, reply0);
  });

  it("should allow GET on printer files cache", async () => {
    const printer = await createTestPrinter(request);
    const response = await request.get(getCacheRoute(printer.id)).send();
    expectOkResponse(response);
  });

  it("should allow GET on printer files thumbnails cache", async () => {
    const response = await request.get(thumbnailsRoute).send();
    expectOkResponse(response);
  });

  it("should allow GET on cached printer thumbnail", async () => {
    const printer = await createTestPrinter(request);
    const response = await request.get(getPrintThumbnailRoute(printer.id)).send();
    expectOkResponse(response);
  });

  it("should allow POST to reload thumbnail cache", async () => {
    const printer = await createTestPrinter(request);
    nock(printer.printerURL).get("/api/files/local/123.gcode").reply(200, "; thumbnail begin\n; thumbnail end");
    const response = await request.post(reloadThumbnailRoute(printer.id)).send({
      filePath: "123.gcode",
    });
    expectOkResponse(response);
  });

  it("should allow DELETE to remove a printer file or folder", async () => {
    const printer = await createTestPrinter(request);

    const filename = "test.gcode";
    nock(printer.printerURL)
      .delete("/api/files/local/" + filename)
      .reply(200);

    const response = await request.delete(deleteFileRoute(printer.id, filename)).send();
    expectOkResponse(response);
  });

  it("should allow DELETE to clear printer files - with status result", async () => {
    const printer = await createTestPrinter(request);
    const jsonFile = require("./test-data/octoprint-file.data.json");

    nock(printer.printerURL)
      .delete("/api/files/local/" + jsonFile.path)
      .reply(200);

    nock(printer.printerURL)
      .get("/api/files/local")
      .query("recursive=false")
      .reply(200, { files: [jsonFile], free: 1, total: 1 });

    // octoprintClient.storeResponse({ files: [jsonFile] }, 200);
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

  it("should allow POST to print a printer file", async () => {
    const printer = await createTestPrinter(request);

    const filename = "test.gcode";
    nock(printer.printerURL)
      .post("/api/files/local/" + filename)
      .reply(200);

    const response = await request.post(printFileRoute(printer.id)).send({
      filePath: filename,
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
    nock(printer.printerURL)
      .get("/api/files/local")
      .query("recursive=false")
      .reply(200, { files: [], free: 1, total: 1 });

    const response = await request.post(uploadFileRoute(printer.id)).attach("file", gcodePath);
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

    const response = await request
      .post(uploadFileRoute(printer.id))
      .field("print", true)
      .attach("file", invalidGcodePath);
    console.log(response);
    expectInvalidResponse(response, ["error"]);
  });

  it("should deny POST to upload printer files when empty", async () => {
    const printer = await createTestPrinter(request);
    const response = await request.post(uploadFileRoute(printer.id)).send();
    expectInvalidResponse(response);
  });
});
