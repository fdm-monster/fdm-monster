const PrinterGroupModel = require("../models/PrinterGroup");
const _ = require("lodash");
const { validateInput } = require("../handlers/validators");
const {
  createPrinterGroupRules,
  printerInGroupRules,
  printerIdRules,
  updatePrinterGroupNameRules,
} = require("./validators/printer-group-service.validation");
const { NotFoundException } = require("../exceptions/runtime.exceptions");

class PrinterGroupService {
  #printerService;
  #logger;

  constructor({ printerService, loggerFactory }) {
    this.#printerService = printerService;
    this.#logger = loggerFactory(PrinterGroupService.name);
  }

  /**
   * Lists the printer groups present in the database.
   */
  async list() {
    return PrinterGroupModel.find({});
  }

  async get(groupId) {
    const printerGroup = await PrinterGroupModel.findOne({ _id: groupId });
    if (!printerGroup)
      throw new NotFoundException(`Printer group with id ${groupId} does not exist.`);

    return printerGroup;
  }

  /**
   * Stores a new printer group into the database.
   * @param {Object} group object to create.
   * @throws {Error} If the printer group is not correctly provided.
   */
  async create(group) {
    if (!group) throw new Error("Missing printer-group");

    const validatedInput = await validateInput(group, createPrinterGroupRules);

    return PrinterGroupModel.create(validatedInput);
  }

  async updateName(printerGroupId, input) {
    const printerGroup = await this.get(printerGroupId);

    const { name } = await validateInput(input, updatePrinterGroupNameRules);
    printerGroup.name = name;
    return await printerGroup.save();
  }

  /**
   * Updates the printerGroup present in the database.
   * @param {Object} printerGroup object to create.
   */
  async update(printerGroup) {
    return PrinterGroupModel.updateOne(printerGroup.id, printerGroup);
  }

  async addOrUpdatePrinter(printerGroupId, printerInGroup) {
    const group = await this.get(printerGroupId);
    if (!group) throw new NotFoundException("This group does not exist", "printerGroupId");

    const validInput = await validateInput(printerInGroup, printerInGroupRules);

    const foundPrinterInGroupIndex = group.printers.findIndex(
      (pig) => pig.printerId.toString() === validInput.printerId
    );
    if (foundPrinterInGroupIndex !== -1) {
      group.printers[foundPrinterInGroupIndex] = validInput;
      return group;
    } else {
      group.printers.push(validInput);
    }

    await group.save();

    return group;
  }

  async removePrinter(printerGroupId, input) {
    const validInput = await validateInput(input, printerIdRules);
    const group = await this.get(printerGroupId);
    if (!group) throw new NotFoundException("This group does not exist", "printerGroupId");

    const foundPrinterInGroupIndex = group.printers.findIndex(
      (pig) => pig.printerId.toString() === validInput.printerId
    );
    if (foundPrinterInGroupIndex === -1) return group;
    group.printers.splice(foundPrinterInGroupIndex, 1);
    return await group.save();
  }

  async delete(groupId) {
    return PrinterGroupModel.deleteOne({ _id: groupId });
  }
}

module.exports = PrinterGroupService;
