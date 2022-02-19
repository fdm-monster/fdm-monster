import { AppConstants } from "../../../server.constants";
import extensions from "../../extensions.js";
const { expectOkResponse } = extensions;
const printerGroupRoute = AppConstants.apiRoute + "/printer-group";
async function createTestPrinterGroup(request) {
    const createResponse = await request.post(printerGroupRoute).send({
        name: "Group0_0",
        location: {
            x: -1,
            y: -1
        },
        printers: []
    });
    return expectOkResponse(createResponse, {
        location: { x: -1, y: -1 },
        printers: expect.any(Array)
    });
}
export { createTestPrinterGroup };
export default {
    createTestPrinterGroup
};
