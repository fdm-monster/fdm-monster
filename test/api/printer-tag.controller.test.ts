import { Test } from "supertest";
import { setupTestApp } from "../test-server";
import { PrinterTagController } from "@/controllers/printer-tag.controller";
import { AppConstants } from "@/server.constants";
import { expectNotFoundResponse, expectOkResponse } from "../extensions";
import { createTestPrinter } from "./test-data/create-printer";
import TestAgent from "supertest/lib/agent";
import { TagWithPrintersDto } from "@/services/interfaces/tag.dto";

let request: TestAgent<Test>;

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

const defaultRoute = AppConstants.apiRoute + "/printer-tag";
const listTagsRoute = defaultRoute;
const createTagRoute = defaultRoute;
const getRoute = (id: string) => `${defaultRoute}/${id}`;
const deleteRoute = (id: string) => `${defaultRoute}/${id}`;
const updateTagNameRoute = (id: string) => `${defaultRoute}/${id}/name`;
const addPrinterToTagRoute = (id: string) => `${defaultRoute}/${id}/printer`;
const deletePrinterFromTagRoute = (id: string) => `${addPrinterToTagRoute(id)}`;

describe(PrinterTagController.name, () => {
  it("should list groups", async () => {
    const response = await request.get(listTagsRoute).send();
    expectOkResponse(response);
  });

  it("should create and tag", async () => {
    const testTagName = "Tag1";
    const response = await request.post(createTagRoute).send({
      name: testTagName,
    });
    expectOkResponse(response);
    const groupName = response.body.name;
    expect(groupName).toStrictEqual(testTagName);
    const groupId = response.body.id;
    expect(groupId).toBeDefined();

    const getResponse = await request.get(getRoute(groupId)).send();
    expectOkResponse(getResponse);
    expect(getResponse.body.id).toStrictEqual(groupId);
  });

  it("should create and update tag name", async () => {
    const testName = "Tag2";
    const testName2 = "Tag2b";
    const response = await request.post(createTagRoute).send({
      name: testName,
    });
    expectOkResponse(response);
    const groupName = response.body.name;
    expect(groupName).toStrictEqual(testName);
    const groupId = response.body.id;
    expect(groupId).toBeDefined();

    const createResponse = await request.patch(updateTagNameRoute(groupId)).send({
      name: testName2,
    });
    expectOkResponse(createResponse);
    const getResponse = await request.get(getRoute(groupId)).send();
    expectOkResponse(getResponse);
    expect(getResponse.body.name).toStrictEqual(testName2);
  });

  it("should create and remove tag", async () => {
    const testTagName = "Tag3";
    const response = await request.post(createTagRoute).send({
      name: testTagName,
    });
    expectOkResponse(response);
    const groupId = response.body.id;
    expect(groupId).toBeDefined();

    const deleteResponse = await request.delete(deleteRoute(groupId)).send();
    expectOkResponse(deleteResponse);

    const getResponse = await request.get(getRoute(groupId)).send();
    expectNotFoundResponse(getResponse);
  });

  it("should create tag and add a printer to it", async () => {
    const testTagName = "Tag4";
    const response = await request.post(createTagRoute).send({
      name: testTagName,
    });
    expectOkResponse(response);
    const groupName = response.body.name;
    expect(groupName).toStrictEqual(testTagName);
    const groupId = response.body.id;

    const printer = await createTestPrinter(request, false);
    const printerId = printer.id;
    expect(printerId).toBeDefined();

    const createResponse = await request.post(addPrinterToTagRoute(groupId)).send({
      groupId,
      printerId,
    });
    expectOkResponse(createResponse);

    const responseTags = await request.get(listTagsRoute).send();
    expectOkResponse(responseTags);
    const groups = responseTags.body as TagWithPrintersDto[];
    expect(groups.length).toBeGreaterThan(0);
    const groupUnderTest = groups.find((g) => g.id == groupId);
    expect(groupUnderTest).toBeDefined();
    expect(groupUnderTest!.printers.find((p) => p.printerId === printerId)).toBeDefined();
  });

  it("should create tag and add+remove a printer", async () => {
    const testTagName = "Tag5";
    const response = await request.post(createTagRoute).send({
      name: testTagName,
    });
    expectOkResponse(response);
    const groupName = response.body.name;
    expect(groupName).toStrictEqual(testTagName);
    const groupId = response.body.id;

    const printer = await createTestPrinter(request, false);
    const printerId = printer.id;
    expect(printerId).toBeDefined();

    const createResponse = await request.post(addPrinterToTagRoute(groupId)).send({
      printerId,
    });
    expectOkResponse(createResponse);
    const deleteResponse = await request.delete(deletePrinterFromTagRoute(groupId)).send({
      printerId,
    });
    expectOkResponse(deleteResponse);
    const responseTags = await request.get(getRoute(groupId)).send();
    expectOkResponse(responseTags);
    const groupUnderTest = responseTags.body as TagWithPrintersDto;
    expect(groupUnderTest).toBeDefined();
    expect(groupUnderTest.printers.find((p) => p.printerId === printerId)).toBeUndefined();
  });
});
