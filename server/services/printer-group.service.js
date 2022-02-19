import _ from "lodash";
import PrinterGroupModel from "../models/PrinterGroup.js";
import {validateInput} from "../handlers/validators.js";
import {
    createPrinterGroupRules,
    printerIdRules,
    printerInGroupRules,
    updatePrinterGroupNameRules
} from "./validators/printer-group-service.validation.js";
import {NotFoundException} from "../exceptions/runtime.exceptions.js";


class PrinterGroupService {
    #printerService;
    #logger;

    constructor({printerService, loggerFactory}) {
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
        const printerGroup = await PrinterGroupModel.findOne({_id: groupId});
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
        if (!group)
            throw new Error("Missing printer-group");
        const validatedInput = await validateInput(group, createPrinterGroupRules);
        return PrinterGroupModel.create(validatedInput);
    }

    async updateName(printerGroupId, input) {
        const printerGroup = await this.get(printerGroupId);
        const {name} = await validateInput(input, updatePrinterGroupNameRules);
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
        if (!group)
            throw new NotFoundException("This group does not exist", "printerGroupId");
        const validInput = await validateInput(printerInGroup, printerInGroupRules);
        const foundPrinterInGroupIndex = group.printers.findIndex((pig) => pig.printerId.toString() === validInput.printerId);
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
        if (!group)
            throw new NotFoundException("This group does not exist", "printerGroupId");
        const foundPrinterInGroupIndex = group.printers.findIndex((pig) => pig.printerId.toString() === validInput.printerId);
        if (foundPrinterInGroupIndex === -1)
            return group;
        group.printers.splice(foundPrinterInGroupIndex, 1);
        return await group.save();
    }

    async delete(groupId) {
        return PrinterGroupModel.deleteOne({_id: groupId});
    }

    /**
     * Synchronize the old 'group' prop of each printer to become full-fledged PrinterGroup docs
     */
    async syncPrinterGroups() {
        const existingGroups = await this.list();
        const printers = (await this.#printerService.list()).filter((p) => !!p.group?.length);
        const printersGrouped = _.groupBy(printers, "group");
        // Early quit
        if (!printers || printers.length === 0)
            return [];
        // Detect groups which are not yet made
        for (const [groupName, printers] of Object.entries(printersGrouped)) {
            // Skip any printer with falsy group property
            if (typeof groupName !== "string" || !groupName)
                continue;
            // Check if group already exists by this name
            const printerIds = printers.map((p) => {
                const index = (new URL(p.printerURL).port || 80) - 80;
                return {
                    printerId: p._id,
                    location: index
                };
            });
            const matchingGroup = existingGroups.find((g) => g.name.toUpperCase() === groupName.toUpperCase());
            if (!!matchingGroup) {
                matchingGroup.printers = printerIds;
                await matchingGroup.save();
            } else {
                let location = {x: -1, y: -1};
                if (groupName.includes("_")) {
                    const lastThree = groupName.substr(groupName.length - 3);
                    const y = parseInt(lastThree[2]);
                    const x = parseInt(lastThree[0]);
                    location = {x, y};
                }
                const newGroup = await PrinterGroupModel.create({
                    name: groupName,
                    location,
                    printers: printerIds
                });
                existingGroups.push(newGroup);
            }
        }
        return PrinterGroupModel.find({});
    }
}

export default PrinterGroupService;
