const dbHandler = require("../db-handler");
const { configureContainer } = require("../../container");
const PrinterModel = require("../../models/Printer");
const DITokens = require("../../container.tokens");
const { testPrinterData } = require("./test-data/printer.data");
const { MATERIALS } = require("../../constants/service.constants");

let container;
let printerFilesService;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  printerFilesService = container.resolve(DITokens.printerFilesService);
});

afterAll(async () => {
  return PrinterModel.deleteMany({});
});

describe("PrinterFileService", () => {
  const plaFileNames = [
    "10xC7760B_pla_zwart_1d30m860g_innerhood_reslice.gcode",
    "10xP8775B_PLA_MAT zwart_1h30mmin_5ding.gcode",
    "38x CH8027A_PLA_zwart_21h_181g_04mmnozzle_1 behuizing.gcode",
    "3x P7743A_PLA_lictgrij_1d_8h_682g_reslice met fillet gespiegeld.gcode",
    "3x P7743A_PLA_lictgrij_1d_8h_682g_reslice met fillet.gcode"
  ];
  const noAmountNames = [
    "P8296A_PERFECTE 1e LAAG!!_PLA_lichtroze_9h5m_87g_20stuks.gcode",
    "P8896C_PLA_zwart_5h30m_61g_smooth bed_6 stuks"
  ];
  const carbonNames = ["1x P5803A_PETGCarbon_6h_78g.gcode"];

  it("Must be able to parse common file names", () => {
    for (let file of plaFileNames) {
      const result = printerFilesService.parseFileNameFormat(file);
      expect(result.material).toBe(MATERIALS.PLA);
      expect(result.amount).toBeGreaterThan(0);
      expect(result.color).toBeDefined();
      expect(result.color.length).toBeGreaterThan(0);
      expect(result.orderCode).not.toHaveLength(0);
    }
  });

  it("Must be able to parse file names without amount", () => {
    for (let file of noAmountNames) {
      const result = printerFilesService.parseFileNameFormat(file);
      expect(result.material).toBe(MATERIALS.PLA);
      expect(result.amount).toBeUndefined();
      expect(result.color).toBeDefined();
      expect(result.color.length).toBeGreaterThan(0);
      expect(result.orderCode).not.toHaveLength(0);
    }
  });

  it("Must be able to parse file names without amount", () => {
    for (let file of carbonNames) {
      const result = printerFilesService.parseFileNameFormat(file);
      expect(result.material).toBe(MATERIALS.CARBON);
      expect(result.amount).toBe(1);
      expect(result.color).toBeUndefined();
      expect(result.orderCode).not.toHaveLength(0);
    }
  });
});
