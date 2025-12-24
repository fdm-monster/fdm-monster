import { Test } from "supertest";
import { setupTestApp } from "../test-server";
import { PrinterGroupController } from "@/controllers/printer-group.controller";
import { AppConstants } from "@/server.constants";
import { expectInternalServerError, expectNotFoundResponse, expectOkResponse } from "../extensions";
import { createTestPrinter } from "./test-data/create-printer";
import { GroupWithPrintersDto } from "@/services/interfaces/group.dto";
import TestAgent from "supertest/lib/agent";

let request: TestAgent<Test>;

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

const defaultRoute = AppConstants.apiRoute + "/printer-group";
const listGroupsRoute = defaultRoute;
const createGroupRoute = defaultRoute;
const getRoute = (id: string) => `${defaultRoute}/${id}`;
const deleteRoute = (id: string) => `${defaultRoute}/${id}`;
const updateGroupNameRoute = (id: string) => `${defaultRoute}/${id}/name`;
const addPrinterToGroupRoute = (id: string) => `${defaultRoute}/${id}/printer`;
const deletePrinterFromGroupRoute = (id: string) => `${addPrinterToGroupRoute(id)}`;

describe(PrinterGroupController.name, () => {
  it("should list groups", async () => {
    const response = await request.get(listGroupsRoute).send();
    expectOkResponse(response);
  });

  it("should create and get group", async () => {
    const testGroupName = "Group1";
    const response = await request.post(createGroupRoute).send({
      name: testGroupName,
    });
    expectOkResponse(response);
    const groupName = response.body.name;
    expect(groupName).toStrictEqual(testGroupName);
    const groupId = response.body.id;
    expect(groupId).toBeDefined();

    const getResponse = await request.get(getRoute(groupId)).send();
    expectOkResponse(getResponse);
    expect(getResponse.body.id).toStrictEqual(groupId);
  });

  it("should create and update group name", async () => {
    const testGroupName = "Group2";
    const testGroupName2 = "Group2b";
    const response = await request.post(createGroupRoute).send({
      name: testGroupName,
    });
    expectOkResponse(response);
    const groupName = response.body.name;
    expect(groupName).toStrictEqual(testGroupName);
    const groupId = response.body.id;
    expect(groupId).toBeDefined();

    const createResponse = await request.patch(updateGroupNameRoute(groupId)).send({
      name: testGroupName2,
    });
    expectOkResponse(createResponse);
    const getResponse = await request.get(getRoute(groupId)).send();
    expectOkResponse(getResponse);
    expect(getResponse.body.name).toStrictEqual(testGroupName2);
  });

  it("should create and remove group", async () => {
    const testGroupName = "Group3";
    const response = await request.post(createGroupRoute).send({
      name: testGroupName,
    });
    expectOkResponse(response);
    const groupId = response.body.id;
    expect(groupId).toBeDefined();

    const deleteResponse = await request.delete(deleteRoute(groupId)).send();
    expectOkResponse(deleteResponse);

    const getResponse = await request.get(getRoute(groupId)).send();
    expectNotFoundResponse(getResponse);
  });

  it("should create group and add a printer to it", async () => {
    const testGroupName = "Group4";
    const response = await request.post(createGroupRoute).send({
      name: testGroupName,
    });
    expectOkResponse(response);
    const groupName = response.body.name;
    expect(groupName).toStrictEqual(testGroupName);
    const groupId = response.body.id;

    const printer = await createTestPrinter(request, false);
    const printerId = printer.id;
    expect(printerId).toBeDefined();

    const createResponse = await request.post(addPrinterToGroupRoute(groupId)).send({
      groupId,
      printerId,
    });
    expectOkResponse(createResponse);

    const responseGroups = await request.get(listGroupsRoute).send();
    expectOkResponse(responseGroups);
    const groups = responseGroups.body as GroupWithPrintersDto[];
    expect(groups.length).toBeGreaterThan(0);
    const groupUnderTest = groups.find((g) => g.id == groupId);
    expect(groupUnderTest).toBeDefined();
    expect(groupUnderTest!.printers.find((p) => p.printerId === printerId)).toBeDefined();
  });

  it("should create group and add+remove a printer", async () => {
    const testGroupName = "Group5";
    const response = await request.post(createGroupRoute).send({
      name: testGroupName,
    });
    expectOkResponse(response);
    const groupName = response.body.name;
    expect(groupName).toStrictEqual(testGroupName);
    const groupId = response.body.id;

    const printer = await createTestPrinter(request, false);
    const printerId = printer.id;
    expect(printerId).toBeDefined();

    const createResponse = await request.post(addPrinterToGroupRoute(groupId)).send({
      printerId,
    });
    expectOkResponse(createResponse);
    const deleteResponse = await request.delete(deletePrinterFromGroupRoute(groupId)).send({
      printerId,
    });
    expectOkResponse(deleteResponse);
    const responseGroups = await request.get(getRoute(groupId)).send();
    expectOkResponse(responseGroups);
    const groupUnderTest = responseGroups.body as GroupWithPrintersDto;
    expect(groupUnderTest).toBeDefined();
    expect(groupUnderTest.printers.find((p) => p.printerId === printerId)).toBeUndefined();
  });
});
