const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { findFileIndex } = require("../utils/find-predicate.utils");
const { Status, MATERIALS } = require("../constants/service.constants");
const { findColorRAL, flattenedDutchRALMap } = require("../constants/ral-color-map.constants");

/**
 * An extension repository for managing printer files in database
 */
class PrinterFilesService {
  #printerService;

  #logger;

  constructor({ printerService, loggerFactory }) {
    this.#printerService = printerService;
    this.#logger = loggerFactory("PrinterFilesService");
  }

  async getPrinterFilesStorage(printerId) {
    const printer = await this.#printerService.get(printerId);

    return {
      fileList: printer.fileList,
      storage: printer.storage,
    };
  }

  async updateFiles(printerId, fileList) {
    const printer = await this.#printerService.get(printerId);

    printer.fileList = fileList;

    printer.markModified("fileList");
    await printer.save();

    return printer.fileList;
  }

  async appendOrReplaceFile(printerId, addedFile) {
    const printer = await this.#printerService.get(printerId);

    const foundFileIndex = printer.fileList.files.findIndex((f) => f.path === addedFile.path);
    if (foundFileIndex === -1) {
      printer.fileList.files.push(addedFile);
    } else {
      printer.fileList.files[foundFileIndex] = addedFile;
    }

    printer.markModified("fileList");
    await printer.save();

    // Only now are we allowed to adjust the last uploaded printer file
    let lastPrintedFile = {};
    try {
      lastPrintedFile = await this.setPrinterLastPrintedFile(printerId, addedFile.name);
    } catch (e) {
      this.#logger.warning(`Parsing printer file did not succeed. Filename: ${addedFile}`);
    }

    return { fileList: printer.fileList, lastPrintedFile };
  }

  async setPrinterLastPrintedFile(printerId, fileName) {
    const printer = await this.#printerService.get(printerId);

    const parsedData = !!fileName ? this.parseFileNameFormat(fileName) : {};
    const mappedRALColor = findColorRAL(parsedData?.color);

    // If we have no info yet, or if we certainly have a parsed color
    if (!printer.lastPrintedFile?.parsedColor || !!mappedRALColor?.RAL) {
      printer.lastPrintedFile = {
        fileName,
        editTimestamp: Date.now(),
        parsedColor: parsedData?.color || undefined,
        parsedVisualizationRAL: mappedRALColor?.RAL || undefined,
        parsedAmount: parsedData?.amount || undefined,
        parsedOrderCode: parsedData?.orderCode || undefined,
        parsedMaterial: parsedData?.material || undefined,
      };
    }

    printer.markModified("lastPrintedFile");
    await printer.save();

    this.#logger.info("Parsed and updated printer file", printer.lastPrintedFile);
    return printer.lastPrintedFile;
  }

  async clearFiles(printerId) {
    const printer = await this.#printerService.get(printerId);
    printer.fileList.files = [];
    printer.markModified("fileList");
    await printer.save();
  }

  /**
   * Perform delete action on database
   * @param printerId
   * @param filePath
   * @param throwError when false no error will be thrown for a missing file
   * @returns {Promise<*>}
   */
  async deleteFile(printerId, filePath, throwError = true) {
    const printer = await this.#printerService.get(printerId);

    const fileIndex = findFileIndex(printer.fileList, filePath);

    if (fileIndex === -1) {
      if (throwError) {
        throw new NotFoundException(
          `A file removal was ordered but this file was not found in database for printer Id ${printerId}`,
          filePath
        );
      } else {
        this.#logger.warning("File was not found in printer fileList");
      }
    }

    printer.fileList.files.splice(fileIndex, 1);
    printer.markModified("fileList");
    await printer.save();
  }

  parseFileNameFormat(fileName) {
    const compactName = fileName.replace(/ /g, ""); // Remove whitespace
    const compactNameUpper = compactName.toUpperCase();

    const amountRestStr = compactNameUpper.substring(compactNameUpper.indexOf("X") + 1);
    const amountStr = compactNameUpper.substring(0, compactNameUpper.indexOf("X"));
    const hasAmount = amountStr?.length >= 1;
    const amountCorrect = hasAmount && amountStr.length < 4;
    const amount = amountCorrect ? parseInt(amountStr) : undefined;

    // Fallback if no X present
    const amountReducedName = hasAmount ? amountRestStr : compactNameUpper;

    // Independently split order code
    const orderCodeOptions = amountReducedName.split("_", 1);
    const hasOrderCode = !!(orderCodeOptions?.length && orderCodeOptions[0]?.length);
    const orderCode = hasOrderCode ? orderCodeOptions[0] : undefined;

    // Independently parse material and optionally color (PLA,PETG)
    const material = this.#parseMaterialType(amountReducedName);
    let color;
    if (material === MATERIALS.PLA || material === MATERIALS.PETG) {
      const materialSplit = amountReducedName.split(material, 2);
      if (materialSplit?.length) {
        // Keep right part of split
        const splitSectors = materialSplit[1].split("_");
        if (splitSectors.length >= 2) {
          color = splitSectors[1];
        }
      }
    }

    const colorExists = color?.length
      ? flattenedDutchRALMap.find((c) => color === Object.keys(c)[0].toUpperCase())
      : false;

    // Determine if fallback is needed
    let fallbackApplied = false;
    if (!colorExists) {
      if (!color?.length) {
        color = this.#fallbackColorMapping(amountReducedName);
      } else {
        color = this.#fallbackColorMapping(color) || color;
      }
      fallbackApplied = true;
      this.#logger.warning(
        `Fallback color analyzed. String ${amountReducedName} resulted in color ${color}`
      );
    }

    return {
      color,
      fallbackApplied,
      orderCode,
      amount,
      material,
    };
  }

  #fallbackColorMapping(searchString) {
    const mappedColor = flattenedDutchRALMap.find((c) =>
      searchString?.includes(Object.keys(c)[0].toUpperCase())
    );
    return !!mappedColor ? Object.keys(mappedColor)[0]?.toUpperCase() : undefined;
  }

  #parseMaterialType(input) {
    const hasPETGCarbon = input.includes(MATERIALS.CARBON) ? MATERIALS.CARBON : undefined;
    const hasBronze = input.includes(MATERIALS.COPPER) ? MATERIALS.COPPER : undefined;
    const hasCopper = input.includes(MATERIALS.BRONZE) ? MATERIALS.BRONZE : undefined;
    const hasFlex = input.includes(MATERIALS.FLEX) ? MATERIALS.FLEX : undefined;
    const hasPETG = input.includes(MATERIALS.PETG) ? MATERIALS.PETG : undefined;
    const hasPLA = input.includes(MATERIALS.PLA) ? MATERIALS.PLA : undefined;

    return hasPLA || hasPETGCarbon || hasBronze || hasCopper || hasFlex || hasPETG;
  }
}

module.exports = PrinterFilesService;
