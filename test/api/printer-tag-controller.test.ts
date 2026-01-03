import { setupTestApp } from "../test-server";
import {
  expectNotFoundResponse,
  expectOkResponse,
} from "../extensions";
import { createTestPrinter } from "./test-data/create-printer";
import { createTestTag, tagRoute } from "./test-data/create-tag";
import { Tag } from "@/entities";
import { AppConstants } from "@/server.constants";
import { Test } from "supertest";
import { PrinterTagController } from "@/controllers/printer-tag.controller";
import { getDatasource } from "../typeorm.manager";
import TestAgent from "supertest/lib/agent";

const listRoute = `${AppConstants.apiRoute}/printer-tag`;
const getRoute = (id: number) => `${listRoute}/${id}`;
const deleteRoute = (id: number) => `${listRoute}/${id}`;
const updateNameRoute = (id: number) => `${getRoute(id)}/name`;
const updateColorRoute = (id: number) => `${getRoute(id)}/color`;
const addPrinterToTagRoute = (id: number) => `${listRoute}/${id}/printer`;
const removePrinterFromTagRoute = (id: number) => `${listRoute}/${id}/printer`;

let request: TestAgent<Test>;

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

beforeEach(async () => {
  return getDatasource().getRepository(Tag).clear();
});

describe(PrinterTagController.name, () => {
  describe("List Tags", () => {
    it("should return empty tag list initially", async () => {
      const response = await request.get(listRoute).send();
      const data = expectOkResponse(response);
      expect(data).toHaveLength(0);
    });

    it("should return tag after creation", async () => {
      await createTestTag(request, "TestTag", "#FF0000");
      const response = await request.get(listRoute).send();
      const data = expectOkResponse(response);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        name: "TestTag",
        color: "#FF0000",
      });
    });

    it("should return multiple tags", async () => {
      await createTestTag(request, "Tag1", "#FF0000");
      await createTestTag(request, "Tag2", "#00FF00");
      await createTestTag(request, "Tag3", "#0000FF");

      const response = await request.get(listRoute).send();
      const data = expectOkResponse(response);
      expect(data).toHaveLength(3);
    });
  });

  describe("Get Tag", () => {
    it("should be able to get tag with printers", async () => {
      const tag = await createTestTag(request, "TestTag", "#FF0000");
      const response = await request.get(getRoute(tag.id)).send();
      expectOkResponse(response, {
        name: "TestTag",
        color: "#FF0000",
        printers: expect.any(Array),
      });
    });

    it("should throw on getting non-existing tag", async () => {
      const response = await request.get(getRoute(99999)).send();
      expectNotFoundResponse(response);
    });
  });

  describe("Create Tag", () => {
    it("should be able to create tag with name only", async () => {
      const response = await request.post(tagRoute).send({
        name: "NewTag",
      });
      expectOkResponse(response, {
        name: "NewTag",
        printers: expect.any(Array),
      });
    });

    it("should be able to create tag with name and color", async () => {
      const response = await request.post(tagRoute).send({
        name: "ColoredTag",
        color: "#ABCDEF",
      });
      expectOkResponse(response, {
        name: "ColoredTag",
        color: "#ABCDEF",
        printers: expect.any(Array),
      });
    });


    it("should strip id from body if provided", async () => {
      const response = await request.post(tagRoute).send({
        id: 12345, // Should be ignored
        name: "TagWithId",
      });
      const data = expectOkResponse(response);
      expect(data.id).not.toBe(12345);
    });

    it("should be able to create multiple tags with same color", async () => {
      const tag1 = await createTestTag(request, "Tag1", "#FF0000");
      const tag2 = await createTestTag(request, "Tag2", "#FF0000");
      expect(tag1.color).toBe(tag2.color);
      expect(tag1.name).not.toBe(tag2.name);
    });
  });

  describe("Update Tag Name", () => {
    it("should be able to update tag name", async () => {
      const tag = await createTestTag(request, "OldName", "#FF0000");
      const response = await request.patch(updateNameRoute(tag.id)).send({
        name: "NewName",
      });
      expectOkResponse(response);

      const getResponse = await request.get(getRoute(tag.id)).send();
      const data = expectOkResponse(getResponse);
      expect(data.name).toBe("NewName");
    });

    it("should not be able to update non-existing tag name", async () => {
      await createTestTag(request, "ValidName", "#FF0000");
      const response = await request.patch(updateNameRoute(99999)).send({
        name: "NewName",
      });
      expectNotFoundResponse(response);
    });
  });

  describe("Update Tag Color", () => {
    it("should be able to update tag color", async () => {
      const tag = await createTestTag(request, "TestTag", "#FF0000");
      const response = await request.patch(updateColorRoute(tag.id)).send({
        color: "#00FF00",
      });
      expectOkResponse(response);

      const getResponse = await request.get(getRoute(tag.id)).send();
      const data = expectOkResponse(getResponse);
      expect(data.color).toBe("#00FF00");
    });

    it("should not be able to update non-existing tag color", async () => {
      const response = await request.patch(updateColorRoute(99999)).send({
        color: "#00FF00",
      });
      expectNotFoundResponse(response);
    });

    it("should be able to update tag color to white", async () => {
      const tag = await createTestTag(request, "TestTag", "#FF0000");
      const response = await request.patch(updateColorRoute(tag.id)).send({
        color: "#FFFFFF",
      });
      expectOkResponse(response);

      const getResponse = await request.get(getRoute(tag.id)).send();
      const data = expectOkResponse(getResponse);
      expect(data.color).toBe("#FFFFFF");
    });
  });

  describe("Delete Tag", () => {
    it("should be able to delete tag", async () => {
      const tag = await createTestTag(request, "TagToDelete", "#FF0000");
      const response = await request.delete(deleteRoute(tag.id)).send();
      expectOkResponse(response);

      const getResponse = await request.get(getRoute(tag.id)).send();
      expectNotFoundResponse(getResponse);
    });

    it("should not be able to delete non-existing tag", async () => {
      const response = await request.delete(deleteRoute(99999)).send();
      expectNotFoundResponse(response);
    });

    it("should be able to delete tag with printers assigned", async () => {
      const printer = await createTestPrinter(request);
      const tag = await createTestTag(request, "TagWithPrinter", "#FF0000");

      // Add printer to tag
      await request.post(addPrinterToTagRoute(tag.id)).send({
        printerId: printer.id,
      });

      // Should be able to delete tag
      const response = await request.delete(deleteRoute(tag.id)).send();
      expectOkResponse(response);
    });
  });

  describe("Add Printer to Tag", () => {
    it("should be able to add printer to tag", async () => {
      const printer = await createTestPrinter(request);
      const tag = await createTestTag(request, "TestTag", "#FF0000");

      const response = await request.post(addPrinterToTagRoute(tag.id)).send({
        printerId: printer.id,
      });
      expectOkResponse(response, {
        printerId: printer.id,
        tagId: tag.id,
      });
    });

    it("should not be able to add printer to non-existing tag", async () => {
      const printer = await createTestPrinter(request);

      const response = await request.post(addPrinterToTagRoute(99999)).send({
        printerId: printer.id,
      });
      expectNotFoundResponse(response);
    });

    it("should be able to add same printer to tag twice (idempotent)", async () => {
      const printer = await createTestPrinter(request);
      const tag = await createTestTag(request, "TestTag", "#FF0000");

      const response1 = await request.post(addPrinterToTagRoute(tag.id)).send({
        printerId: printer.id,
      });
      expectOkResponse(response1);

      const response2 = await request.post(addPrinterToTagRoute(tag.id)).send({
        printerId: printer.id,
      });
      expectOkResponse(response2);

      // Verify tag still has the printer
      const getResponse = await request.get(getRoute(tag.id)).send();
      const data = expectOkResponse(getResponse);
      expect(data.printers).toHaveLength(1);
    });

    it("should be able to add multiple printers to tag", async () => {
      const printer1 = await createTestPrinter(request);
      const printer2 = await createTestPrinter(request);
      const tag = await createTestTag(request, "TestTag", "#FF0000");

      await request.post(addPrinterToTagRoute(tag.id)).send({
        printerId: printer1.id,
      });

      await request.post(addPrinterToTagRoute(tag.id)).send({
        printerId: printer2.id,
      });

      const getResponse = await request.get(getRoute(tag.id)).send();
      const data = expectOkResponse(getResponse);
      expect(data.printers).toHaveLength(2);
    });
  });

  describe("Remove Printer from Tag", () => {
    it("should be able to remove printer from tag", async () => {
      const printer = await createTestPrinter(request);
      const tag = await createTestTag(request, "TestTag", "#FF0000");

      await request.post(addPrinterToTagRoute(tag.id)).send({
        printerId: printer.id,
      });

      const response = await request.delete(removePrinterFromTagRoute(tag.id)).send({
        printerId: printer.id,
      });
      expectOkResponse(response);

      // Verify printer was removed
      const getResponse = await request.get(getRoute(tag.id)).send();
      const data = expectOkResponse(getResponse);
      expect(data.printers).toHaveLength(0);
    });

    it("should not be able to remove printer from non-existing tag", async () => {
      const printer = await createTestPrinter(request);

      const response = await request.delete(removePrinterFromTagRoute(99999)).send({
        printerId: printer.id,
      });
      expectNotFoundResponse(response);
    });

    it("should be able to remove one printer while keeping others", async () => {
      const printer1 = await createTestPrinter(request);
      const printer2 = await createTestPrinter(request);
      const tag = await createTestTag(request, "TestTag", "#FF0000");

      await request.post(addPrinterToTagRoute(tag.id)).send({
        printerId: printer1.id,
      });

      await request.post(addPrinterToTagRoute(tag.id)).send({
        printerId: printer2.id,
      });

      // Remove only printer1
      await request.delete(removePrinterFromTagRoute(tag.id)).send({
        printerId: printer1.id,
      });

      const getResponse = await request.get(getRoute(tag.id)).send();
      const data = expectOkResponse(getResponse);
      expect(data.printers).toHaveLength(1);
      expect(data.printers[0].printerId).toBe(printer2.id);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle tag lifecycle with printers", async () => {
      const printer1 = await createTestPrinter(request);
      const printer2 = await createTestPrinter(request);

      // Create tag
      const tag = await createTestTag(request, "LifecycleTag", "#FF0000");

      // Add printers
      await request.post(addPrinterToTagRoute(tag.id)).send({
        printerId: printer1.id,
      });
      await request.post(addPrinterToTagRoute(tag.id)).send({
        printerId: printer2.id,
      });

      // Update tag name
      await request.patch(updateNameRoute(tag.id)).send({
        name: "UpdatedName",
      });

      // Update tag color
      await request.patch(updateColorRoute(tag.id)).send({
        color: "#00FF00",
      });

      // Verify state
      const getResponse = await request.get(getRoute(tag.id)).send();
      const data = expectOkResponse(getResponse);
      expect(data).toMatchObject({
        name: "UpdatedName",
        color: "#00FF00",
      });
      expect(data.printers).toHaveLength(2);

      // Remove one printer
      await request.delete(removePrinterFromTagRoute(tag.id)).send({
        printerId: printer1.id,
      });

      // Verify one printer remains
      const getResponse2 = await request.get(getRoute(tag.id)).send();
      const data2 = expectOkResponse(getResponse2);
      expect(data2.printers).toHaveLength(1);

      // Delete tag
      const deleteResponse = await request.delete(deleteRoute(tag.id)).send();
      expectOkResponse(deleteResponse);
    });

    it("should handle printer in multiple tags", async () => {
      const printer = await createTestPrinter(request);
      const tag1 = await createTestTag(request, "Tag1", "#FF0000");
      const tag2 = await createTestTag(request, "Tag2", "#00FF00");
      const tag3 = await createTestTag(request, "Tag3", "#0000FF");

      // Add printer to all tags
      await request.post(addPrinterToTagRoute(tag1.id)).send({
        printerId: printer.id,
      });
      await request.post(addPrinterToTagRoute(tag2.id)).send({
        printerId: printer.id,
      });
      await request.post(addPrinterToTagRoute(tag3.id)).send({
        printerId: printer.id,
      });

      // Verify printer is in all tags
      const listResponse = await request.get(listRoute).send();
      const tags = expectOkResponse(listResponse);
      expect(tags).toHaveLength(3);
      tags.forEach((tag: any) => {
        expect(tag.printers).toHaveLength(1);
        expect(tag.printers[0].printerId).toBe(printer.id);
      });
    });
  });
});

