import { setupTestApp } from "../test-server";
import {
  expectInvalidResponse,
  expectNotFoundResponse,
  expectOkResponse,
  expectBadRequestError,
} from "../extensions";
import { AppConstants } from "@/server.constants";
import { createTestPrinter } from "./test-data/create-printer";
import { Test } from "supertest";
import { PrinterMaintenanceLogController } from "@/controllers/printer-maintenance-log.controller";
import TestAgent from "supertest/lib/agent";
import { PrinterMaintenanceLog } from "@/entities/printer-maintenance-log.entity";
import { getDatasource } from "../typeorm.manager";

const defaultRoute = AppConstants.apiRoute + "/printer-maintenance-log";
const getRoute = (id: number) => `${defaultRoute}/${id}`;
const completeRoute = (id: number) => `${defaultRoute}/${id}/complete`;
const deleteRoute = (id: number) => `${defaultRoute}/${id}`;
const getActiveRoute = (printerId: number) => `${defaultRoute}/printer/${printerId}/active`;

let request: TestAgent<Test>;

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

afterEach(async () => {
  await getDatasource().getRepository(PrinterMaintenanceLog).clear();
});

describe(PrinterMaintenanceLogController.name, () => {
  describe(`POST ${defaultRoute}`, () => {
    it("should create a maintenance log", async () => {
      const printer = await createTestPrinter(request);

      const response = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: {
          cause: "Nozzle clog",
          partsInvolved: ["hotend", "nozzle"],
          notes: "Cleaning required",
        },
      });

      expectOkResponse(response, {
        id: expect.any(Number),
        printerId: printer.id,
        printerName: printer.name,
        printerUrl: printer.printerURL,
        completed: false,
        metadata: {
          cause: "Nozzle clog",
          partsInvolved: ["hotend", "nozzle"],
          notes: "Cleaning required",
        },
      });
    });

    it("should validate required fields", async () => {
      const response = await request.post(defaultRoute).send({});

      expectInvalidResponse(response, [
        {
          code: "invalid_type",
          path: "printerId",
        },
      ]);
    });

    it("should validate printerId is a number", async () => {
      const response = await request.post(defaultRoute).send({
        printerId: "not-a-number",
        metadata: {},
      });

      expectInvalidResponse(response, [
        {
          code: "invalid_type",
          path: "printerId",
        },
      ]);
    });

    it("should fail when printer does not exist", async () => {
      const response = await request.post(defaultRoute).send({
        printerId: 99999,
        metadata: { cause: "Test" },
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it("should fail when creating second active maintenance log for same printer", async () => {
      const printer = await createTestPrinter(request);

      await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "First issue" },
      });

      const response = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "Second issue" },
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(400);
      expect(response.body.error).toContain("already has an active maintenance log");
    });
  });

  describe(`GET ${defaultRoute}`, () => {
    it("should list maintenance logs", async () => {
      const printer = await createTestPrinter(request);

      await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "Issue 1" },
      });

      const response = await request.get(defaultRoute).send();

      expectOkResponse(response, {
        logs: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
      });

      expect(response.body.logs.length).toBeGreaterThan(0);
    });

    it("should filter by printerId", async () => {
      const printer1 = await createTestPrinter(request);
      const printer2 = await createTestPrinter(request);

      await request.post(defaultRoute).send({
        printerId: printer1.id,
        metadata: { cause: "Issue 1" },
      });

      await request.post(defaultRoute).send({
        printerId: printer2.id,
        metadata: { cause: "Issue 2" },
      });

      const response = await request.get(defaultRoute).query({ printerId: printer1.id }).send();

      expectOkResponse(response);
      expect(response.body.logs).toHaveLength(1);
      expect(response.body.logs[0].printerId).toBe(printer1.id);
    });

    it("should filter by completed status", async () => {
      const printer = await createTestPrinter(request);

      const createResponse1 = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "Issue 1" },
      });

      await request.post(completeRoute(createResponse1.body.id)).send({
        completionNotes: "Done",
      });

      const activeResponse = await request.get(defaultRoute).query({ completed: false }).send();
      expectOkResponse(activeResponse);
      expect(activeResponse.body.logs).toHaveLength(0);

      const completedResponse = await request.get(defaultRoute).query({ completed: true }).send();
      expectOkResponse(completedResponse);
      expect(completedResponse.body.logs).toHaveLength(1);
    });

    it("should paginate results", async () => {
      const printer = await createTestPrinter(request);

      for (let i = 0; i < 25; i++) {
        const createResponse = await request.post(defaultRoute).send({
          printerId: printer.id,
          metadata: { cause: `Issue ${i}` },
        });

        await request.post(completeRoute(createResponse.body.id)).send({
          completionNotes: "Done",
        });
      }

      const page1Response = await request.get(defaultRoute).query({ page: 1, pageSize: 10 }).send();
      expectOkResponse(page1Response);
      expect(page1Response.body.logs).toHaveLength(10);
      expect(page1Response.body.total).toBe(25);

      const page2Response = await request.get(defaultRoute).query({ page: 2, pageSize: 10 }).send();
      expectOkResponse(page2Response);
      expect(page2Response.body.logs).toHaveLength(10);
    });
  });

  describe(`GET ${getRoute(":id")}`, () => {
    it("should get a maintenance log by id", async () => {
      const printer = await createTestPrinter(request);

      const createResponse = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "Test issue" },
      });

      const response = await request.get(getRoute(createResponse.body.id)).send();

      expectOkResponse(response, {
        id: createResponse.body.id,
        printerId: printer.id,
      });
    });

    it("should return 404 when log not found", async () => {
      const response = await request.get(getRoute(99999)).send();
      expectNotFoundResponse(response);
    });

    it("should return 400 for invalid id", async () => {
      const response = await request.get(`${defaultRoute}/not-a-number`).send();
      expectBadRequestError(response);
    });
  });

  describe(`GET ${defaultRoute}/printer/:printerId/active`, () => {
    it("should get active maintenance log for printer", async () => {
      const printer = await createTestPrinter(request);

      const createResponse = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "Test issue" },
      });

      const response = await request.get(getActiveRoute(printer.id)).send();

      expectOkResponse(response, {
        id: createResponse.body.id,
        completed: false,
      });
    });

    it("should return null when no active log exists", async () => {
      const printer = await createTestPrinter(request);
      const response = await request.get(getActiveRoute(printer.id)).send();

      expectOkResponse(response, null);
    });

    it("should return null when only completed logs exist", async () => {
      const printer = await createTestPrinter(request);

      const createResponse = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "Test issue" },
      });

      await request.post(completeRoute(createResponse.body.id)).send({
        completionNotes: "Done",
      });

      const response = await request.get(getActiveRoute(printer.id)).send();
      expectOkResponse(response, null);
    });

    it("should return 400 for invalid printerId", async () => {
      const response = await request.get(`${defaultRoute}/printer/not-a-number/active`).send();
      expectBadRequestError(response);
    });
  });

  describe(`POST ${completeRoute(":id")}`, () => {
    it("should complete a maintenance log", async () => {
      const printer = await createTestPrinter(request);

      const createResponse = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "Test issue" },
      });

      const response = await request.post(completeRoute(createResponse.body.id)).send({
        completionNotes: "Fixed successfully",
      });

      expectOkResponse(response, {
        id: createResponse.body.id,
        completed: true,
        completedAt: expect.any(String),
        metadata: {
          cause: "Test issue",
          completionNotes: "Fixed successfully",
        },
      });
    });

    it("should complete without completion notes", async () => {
      const printer = await createTestPrinter(request);

      const createResponse = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "Test issue" },
      });

      const response = await request.post(completeRoute(createResponse.body.id)).send({});

      expectOkResponse(response, {
        completed: true,
      });
    });

    it("should return 404 when completing non-existent log", async () => {
      const response = await request.post(completeRoute(99999)).send({
        completionNotes: "Test",
      });

      expectNotFoundResponse(response);
    });

    it("should fail when completing already completed log", async () => {
      const printer = await createTestPrinter(request);

      const createResponse = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "Test issue" },
      });

      await request.post(completeRoute(createResponse.body.id)).send({
        completionNotes: "Done",
      });

      const response = await request.post(completeRoute(createResponse.body.id)).send({
        completionNotes: "Again",
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(400);
      expect(response.body.error).toContain("already completed");
    });

    it("should return 400 for invalid id", async () => {
      const response = await request.post(`${defaultRoute}/not-a-number/complete`).send({});
      expectBadRequestError(response);
    });
  });

  describe(`DELETE ${deleteRoute(":id")}`, () => {
    it("should delete a maintenance log", async () => {
      const printer = await createTestPrinter(request);

      const createResponse = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "Test issue" },
      });

      const deleteResponse = await request.delete(deleteRoute(createResponse.body.id)).send();

      expectOkResponse(deleteResponse, { success: true });

      const getResponse = await request.get(getRoute(createResponse.body.id)).send();
      expectNotFoundResponse(getResponse);
    });

    it("should return 404 when deleting non-existent log", async () => {
      const response = await request.delete(deleteRoute(99999)).send();
      expectNotFoundResponse(response);
    });

    it("should return 400 for invalid id", async () => {
      const response = await request.delete(`${defaultRoute}/not-a-number`).send();
      expectBadRequestError(response);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle full lifecycle: create, complete, create new", async () => {
      const printer = await createTestPrinter(request);

      // Create first log
      const createResponse1 = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "First issue" },
      });
      expectOkResponse(createResponse1);

      // Complete first log
      const completeResponse1 = await request.post(completeRoute(createResponse1.body.id)).send({
        completionNotes: "Fixed",
      });
      expectOkResponse(completeResponse1, { completed: true });

      // Create second log (should work now)
      const createResponse2 = await request.post(defaultRoute).send({
        printerId: printer.id,
        metadata: { cause: "Second issue" },
      });
      expectOkResponse(createResponse2);

      expect(createResponse2.body.id).not.toBe(createResponse1.body.id);
    });

    it("should handle multiple printers with concurrent active logs", async () => {
      const printer1 = await createTestPrinter(request);
      const printer2 = await createTestPrinter(request);

      const response1 = await request.post(defaultRoute).send({
        printerId: printer1.id,
        metadata: { cause: "Issue 1" },
      });

      const response2 = await request.post(defaultRoute).send({
        printerId: printer2.id,
        metadata: { cause: "Issue 2" },
      });

      expectOkResponse(response1);
      expectOkResponse(response2);

      const activeLog1 = await request.get(getActiveRoute(printer1.id)).send();
      const activeLog2 = await request.get(getActiveRoute(printer2.id)).send();

      expectOkResponse(activeLog1, { printerId: printer1.id });
      expectOkResponse(activeLog2, { printerId: printer2.id });
    });
  });
});
