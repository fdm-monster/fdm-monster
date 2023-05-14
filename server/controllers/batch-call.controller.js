const { validateInput } = require("../handlers/validators");
const { batchPrinterRules } = require("./validation/printer-files-controller.validation");
const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { ROLES } = require("../constants/authorization.constants");

class BatchCallController {
  /**
   * @type {BatchCallService}
   */
  batchCallService;

  constructor({ batchCallService }) {
    this.batchCallService = batchCallService;
  }

  async batchConnectUsb(req, res) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules);
    const results = await this.batchCallService.batchConnectUsb(printerIds);
    res.send(results);
  }

  async batchConnectSocket(req, res) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules);
    const results = await this.batchCallService.batchConnectSocket(printerIds);
    res.send(results);
  }


  async batchReprintFiles(req, res) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules);
    const results = await this.batchCallService.batchReprintCalls(printerIds);
    res.send(results);
  }
}

module.exports = createController(BatchCallController)
  .prefix(AppConstants.apiRoute + "/batch")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
  .post("/connect/usb", "batchConnectUsb")
  .post("/connect/socket", "batchConnectSocket")
  .post("/reprint", "batchReprintFiles");
