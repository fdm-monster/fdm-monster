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
  console.log("FILE PARSING AND STORAGE TEST (GCODE/BGCODE/3MF)");
  console.log("=".repeat(80));

  const fileAnalysisService = new FileAnalysisService(loggerFactory);

  // Get test file from command line or use default
  const testFileName = process.argv[2];
  if (!testFileName) {
    console.error(`\n❌ Usage: npx tsx src/consoles/test-file-parse.console.ts <filename>`);
    console.log(`\nAvailable test files in test/api/test-data/:`);
    const testDir = path.join(process.cwd(), "test", "api", "test-data");
    const files = fsSync.readdirSync(testDir);
    files.filter(f => f.match(/\.(gcode|bgcode|3mf|g|gco)$/i)).forEach(f => {
      console.log(`  - ${f}`);
    });
    process.exit(1);
  }

  const testFile = path.join(process.cwd(), "test", "api", "test-data", testFileName);

  if (!fsSync.existsSync(testFile)) {
    console.error(`❌ Test file not found: ${testFile}`);
    process.exit(1);
  }

  const fileExt = path.extname(testFileName).toLowerCase();
  let fileType = "gcode";
  if (fileExt === ".3mf" || testFileName.includes(".gcode.3mf")) fileType = "3mf";
  if (fileExt === ".bgcode") fileType = "bgcode";

  console.log(`\n📂 Test file: ${testFileName}`);
  console.log(`📊 File type: ${fileType}`);
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
  const targetDir = path.join(storageBasePath, fileType);

  // Ensure directory exists
  await fs.mkdir(targetDir, { recursive: true });

  // Generate DETERMINISTIC storage ID from hash + filename
  const nameHash = crypto.createHash('sha256')
    .update(fileHash + testFileName)
    .digest('hex')
    .substring(0, 32);
  const fileStorageId = `${nameHash.substring(0, 8)}-${nameHash.substring(8, 12)}-${nameHash.substring(12, 16)}-${nameHash.substring(16, 20)}-${nameHash.substring(20, 32)}`;
  const targetPath = path.join(targetDir, `${fileStorageId}${fileExt}`);
  const metadataPath = targetPath + ".json";

  console.log(`\n📋 Deterministic ID: ${fileStorageId}`);

  // Copy file
  await fs.copyFile(testFile, targetPath);
  console.log(`✅ Saved file: ${fileStorageId}${fileExt}`);

  // Save metadata with hash and original filename
  const metadataWithMeta = {
    ...metadata,
    _fileHash: fileHash,
    _analyzedAt: new Date().toISOString(),
    _fileStorageId: fileStorageId,
    _originalFileName: testFileName,
  };

  await fs.writeFile(metadataPath, JSON.stringify(metadataWithMeta, null, 2), "utf8");
  console.log(`✅ Saved metadata: ${fileStorageId}${fileExt}.json`);

  // Step 4: Display results
  console.log("\n" + "=".repeat(80));
  console.log("METADATA ANALYSIS");
  console.log("=".repeat(80));

  console.log(`\n🔍 ${fileType.toUpperCase()} METADATA:`);
  const fields = [
    ['fileName', ''],
    ['fileFormat', ''],
    ['fileSize', 'bytes'],
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
    if (value === null || value === undefined) {
      nullCount++;
      console.log(`  ${field.padEnd(30)} ❌ NULL`);
    } else {
      console.log(`  ${field.padEnd(30)} ${value}${unit}`);
    }
  }

  console.log(`\n📊 Null fields: ${nullCount}/${fields.length}`);

  // Show plates data if applicable
  if (metadata.plates && metadata.plates.length > 0) {
    console.log("\n🔍 PLATE-LEVEL DATA:");
    metadata.plates.forEach((plate: any) => {
      console.log(`\n  📋 Plate ${plate.plateNumber}:`);
      const plateFields = Object.entries(plate)
        .filter(([key]) => !['objects', 'thumbnails'].includes(key));

      let plateNullCount = 0;
      plateFields.forEach(([key, value]) => {
        if (value === null || value === undefined) {
          plateNullCount++;
          console.log(`    ${key.padEnd(28)} ❌ NULL`);
        } else {
          console.log(`    ${key.padEnd(28)} ${JSON.stringify(value)}`);
        }
      });
      console.log(`    📊 Null fields: ${plateNullCount}/${plateFields.length}`);
    });
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ TEST COMPLETE");
  console.log("=".repeat(80));
  console.log(`📁 Stored at: ./media/files/${fileType}/${fileStorageId}${fileExt}`);
  console.log(`📄 Metadata at: ./media/files/${fileType}/${fileStorageId}${fileExt}.json`);
  console.log("=".repeat(80));
}

testParsing().catch((error) => {
  console.error("\n❌ TEST FAILED:");
  console.error(error);
  process.exit(1);
});
