import * as dbHandler from "../db-handler.js";
import { AppConstants } from "../../server.constants";
import testServer from "../test-server.js";
import extensions from "../extensions.js";
import PrinterGroup from "../../models/PrinterGroup.js";
import createPrinterGroup from "./test-data/create-printer-group.js";
import createPrinter from "./test-data/create-printer.js";
const { setupTestApp } = testServer;
const { expectOkResponse } = extensions;
const { createTestPrinterGroup } = createPrinterGroup;
const { createTestPrinter } = createPrinter;
let Model = PrinterGroup;
const listRoute = `${AppConstants.apiRoute}/printer-group`;
const createRoute = listRoute;
const syncLegacyRoute = `${listRoute}/sync-legacy`;
const getRoute = (id) => `${listRoute}/${id}`;
const addPrinterToGroupRoute = (id) => `${listRoute}/${id}/printer`;
const deleteRoute = (id) => `${listRoute}/${id}`;
const updateRoute = (id) => `${listRoute}/${id}`;
const updateNameRoute = (id) => `${getRoute(id)}/name`;
let request;
beforeAll(async () => {
    await dbHandler.connect();
    ({ request } = await setupTestApp(true));
});
beforeEach(async () => {
    Model.deleteMany({});
});
describe("PrinterGroupsController", () => {
    it("should return empty printer group list", async () => {
        const response = await request.get(listRoute).send();
        expectOkResponse(response, []);
    });
    it("should be able to create printer group", async () => {
        await createTestPrinterGroup(request);
    });
    it("should be able to get printer group", async () => {
        const group = await createTestPrinterGroup(request);
        const response = await request.get(getRoute(group._id)).send();
        expectOkResponse(response, { name: "Group0_0" });
    });
    it("should be able to update printer group name", async () => {
        const group = await createTestPrinterGroup(request);
        const response = await request.patch(updateNameRoute(group._id)).send({
            name: "newName"
        });
        expectOkResponse(response, { name: "newName" });
    });
    it("should be able to delete printer group", async () => {
        const group = await createTestPrinterGroup(request);
        const response = await request.delete(deleteRoute(group._id)).send();
        expectOkResponse(response);
    });
    it("should be able to add printer to group", async () => {
        const printer = await createTestPrinter(request);
        const group = await createTestPrinterGroup(request);
        expect(group).toMatchObject({ _id: expect.any(String) });
        const response = await request.post(addPrinterToGroupRoute(group._id)).send({
            printerId: printer.id,
            location: "0"
        });
        expectOkResponse(response);
    });
    it("should be able to remove printer from group", async () => {
        const printer = await createTestPrinter(request);
        const group = await createTestPrinterGroup(request);
        expect(group).toMatchObject({ _id: expect.any(String) });
        const response = await request.post(addPrinterToGroupRoute(group._id)).send({
            printerId: printer.id,
            location: "0"
        });
        expectOkResponse(response);
        const deleteResponse = await request.delete(addPrinterToGroupRoute(group._id)).send({
            printerId: printer.id
        });
        expectOkResponse(deleteResponse);
    });
    it("should be able to sync legacy printers to create group automatically", async () => {
        await createTestPrinter(request, "Test0_0");
        const response = await request.post(syncLegacyRoute).send();
        const data = expectOkResponse(response, expect.any(Array));
        expect(data[data.length - 1]).toMatchObject({ name: "Test0_0" });
    });
});
