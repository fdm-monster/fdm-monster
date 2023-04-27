const dbHandler = require("../db-handler");
const { configureContainer } = require("../../container");
const { Printer } = require("../../models/Printer");
const DITokens = require("../../container.tokens");
const { MATERIALS } = require("../../constants/service.constants");
const { flattenedDutchRALMap } = require("../../constants/ral-color-map.constants");

let container;
let printerFilesService;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  printerFilesService = container.resolve(DITokens.printerFilesService);
});

afterAll(async () => {
  return Printer.deleteMany({});
});

describe("PrinterFileService", () => {
  const plaFileNames = [
    { color: "ZWART", name: "10xC7760B_pla_zwart_1d30m860g_innerhood_reslice.gcode" },
    { color: "MATZWART", name: "10xP8775B_PLA_MAT zwart_1h30mmin_5ding.gcode" },
    { color: "ZWART", name: "38x CH8027A_PLA_zwart_21h_181g_04mmnozzle_1 behuizing.gcode" },
    {
      color: "LICTGRIJ",
      name: "3x P7743A_PLA_lictgrij_1d_8h_682g_reslice met fillet gespiegeld.gcode"
    },

    { color: "LICTGRIJ", name: "3x P7743A_PLA_lictgrij_1d_8h_682g_reslice met fillet.gcode" }
  ];
  const customNames = [
    {
      color: "WHITE",
      name: "1x Cubone skull_Small test_WHITE_2h1m_12.3764g_0.2mm"
    },
    {
      color: "WHITE",
      name: "5x Gravitrax Duplo spacers_WHITE_8h19m_152.493g_0.25mm"
    },
    {
      color: "WIT",
      name: "2x P8984B_PLA_WH2offwit_19h30m_182g_1body"
    }
  ];
  const noAmountNames = [
    { color: "LICHTROZE", name: "P8296A_PERFECTE 1e LAAG!!_PLA_lichtroze_9h5m_87g_20stuks.gcode" },
    {
      color: "LICHTGRIJS",
      name: "LAGE PRIO 3x P848A_PLA_lichtgrijs_Powder_16st6h27_69g"
    },
    { color: "ZWART", name: "P8896C_PLA_zwart_5h30m_61g_smooth bed_6 stuks" }
  ];
  const carbonNames = ["1x P5803A_PETGCarbon_6h_78g.gcode"];

  it("Flattened color RAL map should not be empty", () => {
    expect(flattenedDutchRALMap.length).toBeGreaterThan(10);
    expect(flattenedDutchRALMap[27]).toMatchObject({ applegreen: 6027 });
  });

  it("Must be able to parse common file names", () => {
    for (let { color, name } of plaFileNames) {
      const result = printerFilesService.parseFileNameFormat(name);
      expect(result.material, name).toBe(MATERIALS.PLA);
      expect(result.amount, name).toBeGreaterThan(0);
      expect(result.color, name).toBe(color);
      expect(result.orderCode, name).not.toHaveLength(0);
    }
  });

  it("Must be able to parse file custom name colors", () => {
    for (let { color, name } of customNames) {
      const result = printerFilesService.parseFileNameFormat(name);
      expect(result.fallbackApplied, name).toBe(true);
      expect(result.amount, name).toBeDefined();
      expect(result.color, name).toBe(color);
      expect(result.color.length, name).toBeGreaterThan(0);
      expect(result.orderCode, name).not.toHaveLength(0);
    }
  });

  it("Must be able to parse file names without amount", () => {
    for (let { color, name } of noAmountNames) {
      const result = printerFilesService.parseFileNameFormat(name);
      expect(result.material).toBe(MATERIALS.PLA);
      expect(result.amount).toBeUndefined();
      expect(result.color).toBe(color);
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
