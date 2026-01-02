import { FileAnalysisService } from "@/services/file-analysis.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { superRootPath } from "@/utils/fs.utils";
import { AppConstants } from "@/server.constants";
import * as path from "path";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as crypto from "crypto";

const loggerFactory: ILoggerFactory = (name: string) => {
  return {
    log: (msg: string) => console.log(`[${name}] ${msg}`),
    error: (msg: string) => console.error(`[${name}] ERROR: ${msg}`),
    warn: (msg: string) => console.warn(`[${name}] WARN: ${msg}`),
    debug: (msg: string) => console.log(`[${name}] DEBUG: ${msg}`),
  } as any;
};

async function testParsing() {
  console.log("=".repeat(80));
  console.log("3MF PARSING AND STORAGE TEST");
  console.log("=".repeat(80));

  const fileAnalysisService = new FileAnalysisService(loggerFactory);

  // Get test file from command line or use default
  const testFileName = process.argv[2] || "bambu.gcode.3mf";
  const testFile = path.join(process.cwd(), "test", "api", "test-data", testFileName);

  if (!fsSync.existsSync(testFile)) {
    console.error(`❌ Test file not found: ${testFile}`);
    process.exit(1);
  }

  console.log(`\n📂 Test file: ${testFileName}`);
  console.log(`📊 File size: ${fsSync.statSync(testFile).size} bytes`);

  // Step 1: Analyze file
  console.log("\n" + "=".repeat(80));
  console.log("STEP 1: ANALYZING FILE");
  console.log("=".repeat(80));

  const analysisResult = await fileAnalysisService.analyzeFile(testFile);
  const metadata = analysisResult.metadata as any;

  console.log(`\n✅ Analysis complete!`);

  // Step 2: Calculate hash
  const fileBuffer = await fs.readFile(testFile);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  const fileHash = hashSum.digest("hex");

  console.log(`\n📋 File hash: ${fileHash.substring(0, 16)}...`);

  // Step 3: Save to storage manually
  console.log("\n" + "=".repeat(80));
  console.log("STEP 2: SAVING TO STORAGE");
  console.log("=".repeat(80));

  const storageBasePath = path.join(superRootPath(), AppConstants.defaultPrintFilesStorage);
  const targetDir = path.join(storageBasePath, "3mf");

  // Ensure directory exists
  await fs.mkdir(targetDir, { recursive: true });

  // Generate DETERMINISTIC storage ID from hash + filename
  const nameHash = crypto.createHash('sha256')
    .update(fileHash + testFileName)
    .digest('hex')
    .substring(0, 32);
  const fileStorageId = `${nameHash.substring(0, 8)}-${nameHash.substring(8, 12)}-${nameHash.substring(12, 16)}-${nameHash.substring(16, 20)}-${nameHash.substring(20, 32)}`;
  const targetPath = path.join(targetDir, `${fileStorageId}.3mf`);
  const metadataPath = targetPath + ".json";

  console.log(`\n📋 Deterministic ID: ${fileStorageId}`);

  // Copy file
  await fs.copyFile(testFile, targetPath);
  console.log(`✅ Saved file: ${fileStorageId}.3mf`);

  // Save metadata with hash
  const metadataWithMeta = {
    ...metadata,
    _fileHash: fileHash,
    _analyzedAt: new Date().toISOString(),
    _fileStorageId: fileStorageId,
  };

  await fs.writeFile(metadataPath, JSON.stringify(metadataWithMeta, null, 2), "utf8");
  console.log(`✅ Saved metadata: ${fileStorageId}.3mf.json`);

  // Step 4: Display results
  console.log("\n" + "=".repeat(80));
  console.log("METADATA ANALYSIS");
  console.log("=".repeat(80));

  console.log("\n🔍 TOP-LEVEL METADATA:");
  const fields = [
    ['gcodePrintTimeSeconds', 's'],
    ['filamentUsedGrams', 'g'],
    ['filamentUsedMm', 'mm'],
    ['filamentUsedCm3', 'cm³'],
    ['filamentDensityGramsCm3', 'g/cm³'],
    ['filamentDiameterMm', 'mm'],
    ['totalLayers', ''],
    ['maxLayerZ', 'mm'],
    ['slicerVersion', ''],
    ['nozzleDiameterMm', 'mm'],
    ['layerHeight', 'mm'],
    ['firstLayerHeight', 'mm'],
    ['bedTemperature', '°C'],
    ['nozzleTemperature', '°C'],
    ['fillDensity', ''],
    ['filamentType', ''],
    ['printerModel', ''],
  ];

  let nullCount = 0;
  for (const [field, unit] of fields) {
    const value = metadata[field];
    const display = value !== null && value !== undefined ? `${value}${unit}` : '❌ NULL';
    if (value === null || value === undefined) nullCount++;
    console.log(`  ${field.padEnd(30)} ${display}`);
  }

  console.log(`\n📊 Null fields: ${nullCount}/${fields.length}`);

  if (metadata.plates && metadata.plates.length > 0) {
    console.log("\n🔍 PLATE-LEVEL METADATA:");
    metadata.plates.forEach((plate: any, idx: number) => {
      console.log(`\n  📋 Plate ${plate.plateNumber}:`);
      const plateFields = Object.entries(plate)
        .filter(([key]) => !['objects', 'thumbnails'].includes(key));

      let plateNullCount = 0;
      plateFields.forEach(([key, value]) => {
        const display = value !== null && value !== undefined ? JSON.stringify(value) : '❌ NULL';
        if (value === null || value === undefined) plateNullCount++;
        console.log(`    ${key.padEnd(28)} ${display}`);
      });
      console.log(`    📊 Null fields in plate: ${plateNullCount}/${plateFields.length}`);
      console.log(`    🖼️  Thumbnails: ${plate.thumbnails?.length || 0}`);
    });

    // Show aggregation summary for multi-plate
    if (metadata.plates.length > 1) {
      console.log("\n  📊 MULTI-PLATE AGGREGATION:");
      const totalTime = metadata.plates.reduce((sum: number, p: any) => sum + (p.gcodePrintTimeSeconds || 0), 0);
      const totalFilament = metadata.plates.reduce((sum: number, p: any) => sum + (p.filamentUsedGrams || 0), 0);
      const maxLayers = Math.max(...metadata.plates.map((p: any) => p.totalLayers || 0));

      console.log(`    Total print time: ${totalTime}s (${Math.round(totalTime/60)}m)`);
      console.log(`    Total filament: ${totalFilament}g`);
      console.log(`    Max layers: ${maxLayers}`);
      console.log(`\n    ⚠️  Top-level metadata shows first plate only for multi-plate files`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ TEST COMPLETE");
  console.log("=".repeat(80));
  console.log(`📁 Stored at: ./media/files/3mf/${fileStorageId}.3mf`);
  console.log(`📄 Metadata at: ./media/files/3mf/${fileStorageId}.3mf.json`);
  console.log("=".repeat(80));
}

testParsing().catch((error) => {
  console.error("\n❌ TEST FAILED:");
  console.error(error);
  process.exit(1);
});
