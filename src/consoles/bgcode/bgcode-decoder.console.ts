import { BGCodeParser } from "@/utils/parsers/bgcode.parser";
import * as path from "path";
import * as fs from "fs/promises";

/**
 * Console script to decode and display BGCode file metadata
 * Usage: yarn console:bgcode-decoder [file-path] [--extract-gcode] [--output output.gcode]
 */

async function decodeBGCode(filePath: string, extractGCode: boolean = false, outputPath?: string) {
  try {
    // Check if file exists
    await fs.access(filePath);

    console.log("\n========================================");
    console.log("BGCode File Decoder");
    console.log("========================================");
    console.log(`File: ${path.basename(filePath)}`);
    console.log(`Path: ${filePath}`);
    console.log(`Extract G-code: ${extractGCode ? "Yes" : "No"}`);
    console.log("========================================\n");

    // Parse the file
    const parser = new BGCodeParser();
    console.log("Parsing BGCode file (reading all blocks)...");
    const result = await parser.parse(filePath, extractGCode);

    // Display raw metadata
    console.log("RAW METADATA:");
    console.log("----------------------------------------");
    if (result.raw._thumbnails && result.raw._thumbnails.length > 0) {
      console.log(`Thumbnails found: ${result.raw._thumbnails.length}`);
      result.raw._thumbnails.forEach((thumb, idx) => {
        console.log(`  [${idx}] ${thumb.width}x${thumb.height} (${thumb.format}) - ${thumb.size} bytes`);
      });
    } else {
      console.log("No thumbnails found");
    }

    if (result.raw.blocks && result.raw.blocks.length > 0) {
      console.log(`\nBlocks found: ${result.raw.blocks.length}`);
      result.raw.blocks.forEach((block, idx) => {
        console.log(`  [${idx}] ${block.type}: compressed=${block.compressedSize}, uncompressed=${block.uncompressedSize}, compression=${block.compression}`);
      });
    }

    // Display normalized metadata
    console.log("\n\nNORMALIZED METADATA:");
    console.log("----------------------------------------");
    console.log("File Information:");
    console.log(`  File Name: ${result.normalized.fileName}`);
    console.log(`  File Format: ${result.normalized.fileFormat}`);
    console.log(`  File Size: ${result.normalized.fileSize ? `${(result.normalized.fileSize / 1024 / 1024).toFixed(2)} MB` : "N/A"}`);

    console.log("\nSlicer Information:");
    console.log(`  Producer: ${result.normalized.producer || "N/A"}`);
    console.log(`  Slicer Version: ${result.normalized.slicerVersion || "N/A"}`);
    console.log(`  Produced On: ${result.normalized.producedOn || "N/A"}`);
    console.log(`  Checksum Type: ${result.normalized.checksumType || "N/A"}`);
    console.log(`  Printer Model: ${result.normalized.printerModel || "N/A"}`);

    console.log("\nPrint Settings:");
    console.log(`  Print Time: ${result.normalized.gcodePrintTimeSeconds ? formatTime(result.normalized.gcodePrintTimeSeconds) : "N/A"}`);
    console.log(`  Layer Height: ${result.normalized.layerHeight ? `${result.normalized.layerHeight} mm` : "N/A"}`);
    console.log(`  First Layer Height: ${result.normalized.firstLayerHeight ? `${result.normalized.firstLayerHeight} mm` : "N/A"}`);
    console.log(`  Total Layers: ${result.normalized.totalLayers || "N/A"}`);
    console.log(`  Max Layer Z: ${result.normalized.maxLayerZ ? `${result.normalized.maxLayerZ} mm` : "N/A"}`);
    console.log(`  Fill Density: ${result.normalized.fillDensity || "N/A"}`);

    console.log("\nTemperature Settings:");
    console.log(`  Nozzle Temperature: ${result.normalized.nozzleTemperature ? `${result.normalized.nozzleTemperature}°C` : "N/A"}`);
    console.log(`  Bed Temperature: ${result.normalized.bedTemperature ? `${result.normalized.bedTemperature}°C` : "N/A"}`);

    console.log("\nFilament Information:");
    console.log(`  Filament Type: ${result.normalized.filamentType || "N/A"}`);
    console.log(`  Nozzle Diameter: ${result.normalized.nozzleDiameterMm ? `${result.normalized.nozzleDiameterMm} mm` : "N/A"}`);
    console.log(`  Filament Diameter: ${result.normalized.filamentDiameterMm ? `${result.normalized.filamentDiameterMm} mm` : "N/A"}`);
    console.log(`  Filament Density: ${result.normalized.filamentDensityGramsCm3 ? `${result.normalized.filamentDensityGramsCm3} g/cm³` : "N/A"}`);
    console.log(`  Filament Used (Length): ${result.normalized.filamentUsedMm ? `${(result.normalized.filamentUsedMm / 1000).toFixed(2)} m` : "N/A"}`);
    console.log(`  Filament Used (Volume): ${result.normalized.filamentUsedCm3 ? `${result.normalized.filamentUsedCm3.toFixed(2)} cm³` : "N/A"}`);
    console.log(`  Filament Used (Weight): ${result.normalized.filamentUsedGrams ? `${result.normalized.filamentUsedGrams.toFixed(2)} g` : "N/A"}`);
    console.log(`  Total Filament Used: ${result.normalized.totalFilamentUsedGrams ? `${result.normalized.totalFilamentUsedGrams.toFixed(2)} g` : "N/A"}`);

    // Write G-code to file if extracted and output path provided
    if (extractGCode && result.gcode) {
      const defaultOutput = filePath.replace(/\.bgcode$/i, ".gcode");
      const finalOutput = outputPath || defaultOutput;

      console.log("\n\nG-CODE EXTRACTION:");
      console.log("----------------------------------------");
      console.log(`G-code size: ${result.gcode.length} bytes (${(result.gcode.length / 1024).toFixed(2)} KB)`);
      console.log(`Lines of G-code: ${result.gcode.split('\n').length}`);
      console.log(`Writing to: ${finalOutput}`);

      await fs.writeFile(finalOutput, result.gcode, "utf8");
      console.log("✓ G-code file written successfully!");
    } else if (extractGCode && !result.gcode) {
      console.log("\n\n⚠ No G-code extracted (file may use unsupported compression)");
    }

    console.log("\n========================================");
    console.log("Decoding complete!");
    console.log("========================================\n");
  } catch (error: any) {
    console.error("\n❌ Error decoding BGCode file:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s (${seconds}s)`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s (${seconds}s)`;
  } else {
    return `${secs}s`;
  }
}

// Main execution
const args = process.argv.slice(2);
let filePath = "media/files/bgcode/679de1fe-9a4d-fe7e-6903-2bfb8ac9919f.bgcode";
let extractGCode = false;
let outputPath: string | undefined;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--extract-gcode" || args[i] === "-e") {
    extractGCode = true;
  } else if (args[i] === "--output" || args[i] === "-o") {
    outputPath = args[i + 1];
    i++; // Skip next arg
  } else if (!args[i].startsWith("-")) {
    filePath = args[i];
  }
}

console.log("\nStarting BGCode decoder...");
if (args.length === 0) {
  console.log("No file path provided, using default file.");
}
console.log("\nUsage: yarn console:bgcode-decoder [file-path] [--extract-gcode] [--output output.gcode]\n");

decodeBGCode(filePath, extractGCode, outputPath);
