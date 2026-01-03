import * as fs from "node:fs/promises";
import * as path from "node:path";
import AdmZip from "adm-zip";
import { ThreeMFMetadata } from "@/entities/print-job.entity";

interface ThreeMFParseResult {
  raw: {
    _thumbnails?: Array<{
      width: number;
      height: number;
      format: string;
      path?: string;
    }>;
    plates?: any[];
  };
  normalized: ThreeMFMetadata;
  plates?: Array<{
    plateNumber: number;
    gcodePrintTimeSeconds: number | null;
    filamentUsedGrams: number | null;
    totalLayers: number | null;
    objects: Array<{ name: string; bbox?: number[] }>;
    thumbnails?: Array<{
      path: string;
      size: number;
      type: string;
    }>;
  }>;
}

/**
 * 3MF parser for extracting metadata from .3mf files
 * Supports both single and multi-plate 3MF files (Bambu Lab format)
 */
export class ThreeMFParser {
  async parse(filePath: string): Promise<ThreeMFParseResult> {
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);

    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    // Check for metadata.json first (some slicers may use this)
    const metadataJsonEntry = zipEntries.find(e => e.entryName === "metadata.json");
    let metadata: Record<string, any> = {};

    if (metadataJsonEntry) {
      // Parse JSON metadata
      const jsonContent = metadataJsonEntry.getData().toString("utf8");
      const jsonData = JSON.parse(jsonContent);
      metadata = this.normalizeJsonMetadata(jsonData);
    } else {
      // Extract metadata from 3D model XML
      const modelEntry = zipEntries.find(e => e.entryName === "3D/3dmodel.model" || e.entryName === "Metadata/model_settings.config");
      metadata = modelEntry ? this.extractMetadataFromXML(modelEntry.getData().toString("utf8")) : {};
    }

    // Check for multi-plate structure (Bambu Lab)
    const plates = this.extractPlates(zipEntries);
    const isMultiPlate = plates.length > 1;

    // Extract thumbnails
    const thumbnails = this.extractThumbnails(zipEntries);

    // For single-plate files, use plate data for top-level metadata
    let topLevelPrintTime = this.parseTime(metadata.printTime);
    let topLevelFilamentWeight = this.parseFloat(metadata.totalFilamentWeight || metadata.filamentWeight);
    let topLevelLayers = this.parseInt(metadata.layerCount);
    let topLevelFilamentUsedMm = this.parseFloat(metadata.filamentUsed);
    let topLevelFilamentUsedCm3 = this.parseFloat(metadata.filamentVolume);
    let topLevelFilamentDensity = this.parseFloat(metadata.filamentDensity);
    let topLevelMaxZ = this.parseFloat(metadata.maxZ);
    let topLevelSlicerVersion = metadata.slicerVersion || metadata.generator;

    // Additional fields from plates
    let topLevelNozzleDiameter = this.parseFloat(metadata.nozzleDiameter);
    let topLevelLayerHeight = this.parseFloat(metadata.layerHeight || metadata.layer_height);
    let topLevelFirstLayerHeight = this.parseFloat(metadata.firstLayerHeight || metadata.first_layer_height);
    let topLevelBedTemp = this.parseFloat(metadata.bedTemp || metadata.bed_temperature);
    let topLevelNozzleTemp = this.parseFloat(metadata.nozzleTemp || metadata.nozzle_temperature);
    let topLevelFillDensity = metadata.infillDensity || metadata.infill_density || metadata.fill_density || null;
    let topLevelFilamentType = metadata.filamentType || metadata.filament_type || null;
    let topLevelPrinterModel = metadata.printerModel || metadata.printer_model || null;
    let topLevelFilamentDiameter = this.parseFloat(metadata.filamentDiameter || metadata.filament_diameter) || 1.75;

    if (plates.length >= 1 && plates[0]) {
      if (plates.length === 1) {
        // Single plate - promote ALL plate data to top level
        const plate = plates[0] as any;
        topLevelPrintTime = plate.gcodePrintTimeSeconds ?? topLevelPrintTime;
        topLevelFilamentWeight = plate.filamentUsedGrams ?? topLevelFilamentWeight;
        topLevelLayers = plate.totalLayers ?? topLevelLayers;
        topLevelFilamentUsedMm = plate.filamentUsedMm ?? topLevelFilamentUsedMm;
        topLevelFilamentUsedCm3 = plate.filamentUsedCm3 ?? topLevelFilamentUsedCm3;
        topLevelFilamentDensity = plate.filamentDensityGramsCm3 ?? topLevelFilamentDensity;
        topLevelMaxZ = plate.maxLayerZ ?? topLevelMaxZ;
        topLevelSlicerVersion = plate.slicerVersion ?? topLevelSlicerVersion;
        topLevelNozzleDiameter = plate.nozzleDiameterMm ?? topLevelNozzleDiameter;
        topLevelLayerHeight = plate.layerHeight ?? topLevelLayerHeight;
        topLevelFirstLayerHeight = plate.firstLayerHeight ?? topLevelFirstLayerHeight;
        topLevelBedTemp = plate.bedTemperature ?? topLevelBedTemp;
        topLevelNozzleTemp = plate.nozzleTemperature ?? topLevelNozzleTemp;
        topLevelFillDensity = plate.fillDensity ?? topLevelFillDensity;
        topLevelFilamentType = plate.filamentType ?? topLevelFilamentType;
        topLevelPrinterModel = plate.printerModel ?? topLevelPrinterModel;
        topLevelFilamentDiameter = plate.filamentDiameterMm ?? topLevelFilamentDiameter;
      } else {
        // Multi-plate - aggregate data from all plates
        topLevelPrintTime = plates.reduce((sum, p: any) => sum + (p.gcodePrintTimeSeconds || 0), 0);
        topLevelFilamentWeight = plates.reduce((sum, p: any) => sum + (p.filamentUsedGrams || 0), 0);
        topLevelFilamentUsedMm = plates.reduce((sum, p: any) => sum + (p.filamentUsedMm || 0), 0);
        topLevelFilamentUsedCm3 = plates.reduce((sum, p: any) => sum + (p.filamentUsedCm3 || 0), 0);
        topLevelLayers = Math.max(...plates.map((p: any) => p.totalLayers || 0));
        topLevelMaxZ = Math.max(...plates.map((p: any) => p.maxLayerZ || 0));

        // Use first plate for shared settings (all plates have same printer/material settings)
        const firstPlate = plates[0] as any;
        topLevelFilamentDensity = firstPlate.filamentDensityGramsCm3 ?? topLevelFilamentDensity;
        topLevelSlicerVersion = firstPlate.slicerVersion ?? topLevelSlicerVersion;
        topLevelNozzleDiameter = firstPlate.nozzleDiameterMm ?? topLevelNozzleDiameter;
        topLevelLayerHeight = firstPlate.layerHeight ?? topLevelLayerHeight;
        topLevelFirstLayerHeight = firstPlate.firstLayerHeight ?? topLevelFirstLayerHeight;
        topLevelBedTemp = firstPlate.bedTemperature ?? topLevelBedTemp;
        topLevelNozzleTemp = firstPlate.nozzleTemperature ?? topLevelNozzleTemp;
        topLevelFillDensity = firstPlate.fillDensity ?? topLevelFillDensity;
        topLevelFilamentType = firstPlate.filamentType ?? topLevelFilamentType;
        topLevelPrinterModel = firstPlate.printerModel ?? topLevelPrinterModel;
        topLevelFilamentDiameter = firstPlate.filamentDiameterMm ?? topLevelFilamentDiameter;
      }
    }

    const normalized: ThreeMFMetadata = {
      fileName,
      fileFormat: "3mf",
      fileSize: stats.size,
      isMultiPlate,
      totalPlates: plates.length || 1,
      gcodePrintTimeSeconds: topLevelPrintTime,
      nozzleDiameterMm: topLevelNozzleDiameter,
      filamentDiameterMm: topLevelFilamentDiameter,
      filamentDensityGramsCm3: topLevelFilamentDensity,
      filamentUsedMm: topLevelFilamentUsedMm,
      filamentUsedCm3: topLevelFilamentUsedCm3,
      filamentUsedGrams: topLevelFilamentWeight,
      totalFilamentUsedGrams: topLevelFilamentWeight,
      layerHeight: topLevelLayerHeight,
      firstLayerHeight: topLevelFirstLayerHeight,
      bedTemperature: topLevelBedTemp,
      nozzleTemperature: topLevelNozzleTemp,
      fillDensity: topLevelFillDensity,
      filamentType: topLevelFilamentType,
      printerModel: topLevelPrinterModel,
      slicerVersion: topLevelSlicerVersion,
      maxLayerZ: topLevelMaxZ,
      totalLayers: topLevelLayers,
      plates: plates.length > 0 ? plates : undefined,
    };

    return {
      raw: {
        _thumbnails: thumbnails,
        plates: plates.length > 0 ? plates : undefined,
      },
      normalized,
      plates: plates.length > 0 ? plates : undefined,
    };
  }

  private normalizeJsonMetadata(jsonData: any): Record<string, any> {
    // Normalize JSON metadata keys to match expected format
    const metadata: Record<string, any> = {};

    // Map common JSON metadata keys to our internal format
    if (jsonData.nozzleDiameter !== undefined) metadata.nozzleDiameter = String(jsonData.nozzleDiameter);
    if (jsonData.estimatedPrintTimeSec !== undefined) metadata.printTime = String(jsonData.estimatedPrintTimeSec);
    if (jsonData.filamentDiameter !== undefined) metadata.filamentDiameter = String(jsonData.filamentDiameter);
    if (jsonData.filamentDensity !== undefined) metadata.filamentDensity = String(jsonData.filamentDensity);
    if (jsonData.filamentUsedGrams !== undefined) metadata.filamentWeight = String(jsonData.filamentUsedGrams);
    if (jsonData.layerHeight !== undefined) metadata.layerHeight = String(jsonData.layerHeight);
    if (jsonData.firstLayerHeight !== undefined) metadata.firstLayerHeight = String(jsonData.firstLayerHeight);
    if (jsonData.bedTemp !== undefined) metadata.bedTemp = String(jsonData.bedTemp);
    if (jsonData.nozzleTemp !== undefined) metadata.nozzleTemp = String(jsonData.nozzleTemp);
    if (jsonData.fillDensity !== undefined) metadata.infillDensity = String(jsonData.fillDensity);
    if (jsonData.filamentType !== undefined) metadata.filamentType = jsonData.filamentType;
    if (jsonData.printerModel !== undefined) metadata.printerModel = jsonData.printerModel;

    return metadata;
  }

  private extractMetadataFromXML(xml: string): Record<string, string> {
    const metadata: Record<string, string> = {};

    // Extract simple key-value pairs from XML
    const patterns = [
      /<printtime>([^<]+)<\/printtime>/i,
      /<layerheight>([^<]+)<\/layerheight>/i,
      /<filamentused>([^<]+)<\/filamentused>/i,
      /<filamenttype>([^<]+)<\/filamenttype>/i,
      /<nozzlediameter>([^<]+)<\/nozzlediameter>/i,
      /<bedtemperature>([^<]+)<\/bedtemperature>/i,
      /<nozzletemperature>([^<]+)<\/nozzletemperature>/i,
    ];

    for (const pattern of patterns) {
      const match = xml.match(pattern);
      if (match) {
        const key = pattern.source.match(/<([^>]+)>/)?.[1] || "";
        metadata[key] = match[1];
      }
    }

    // Extract generator/slicer info
    const generatorMatch = xml.match(/generator="([^"]+)"/);
    if (generatorMatch) {
      metadata.generator = generatorMatch[1];
      metadata.slicerVersion = generatorMatch[1];
    }

    return metadata;
  }

  private extractPlates(zipEntries: AdmZip.IZipEntry[]): Array<{
    plateNumber: number;
    gcodePrintTimeSeconds: number | null;
    filamentUsedGrams: number | null;
    totalLayers: number | null;
    objects: Array<{ name: string; bbox?: number[] }>;
    thumbnails?: Array<{
      path: string;
      size: number;
      type: string;
    }>;
  }> {
    const plates: Array<any> = [];

    // Look for Bambu Lab plate structure (but not .gcode.md5 files)
    const plateEntries = zipEntries.filter(e => e.entryName.match(/Metadata\/plate_\d+\.gcode$/)  && !e.entryName.endsWith('.md5'));

    if (plateEntries.length === 0) {
      // Single plate file or non-Bambu format
      return [];
    }

    for (const entry of plateEntries) {
      const plateMatch = entry.entryName.match(/plate_(\d+)\.gcode/);
      if (!plateMatch) continue;

      // Bambu uses 1-indexed plate numbers in filenames (plate_1.gcode = plate 1)
      const plateNumber = Number.parseInt(plateMatch[1]);
      // Read more bytes to include CONFIG_BLOCK (contains layer_height, temps, etc.)
      const gcodeContent = entry.getData().toString("utf8", 0, Math.min(50000, entry.getData().length));

      // Parse basic metadata from G-code header
      const metadata = this.parseGCodeHeader(gcodeContent);

      // Find thumbnails for this plate
      const plateThumbs = zipEntries.filter(e =>
        e.entryName.includes(`plate_${plateMatch[1]}`) &&
        (e.entryName.endsWith(".png") || e.entryName.endsWith(".jpg"))
      );

      // Map Bambu G-code header keys to our expected keys
      const printTime = this.parseTime(
        metadata.model_printing_time ||
        metadata.total_estimated_time ||
        metadata.print_time
      );
      const filamentWeight = this.parseFloat(
        metadata.total_filament_weight_g ||
        metadata.filament_weight ||
        metadata.total_filament_weight
      );
      const layerCount = this.parseInt(
        metadata.total_layer_number ||
        metadata.layer_count ||
        metadata.total_layers
      );

      // Extract all available Bambu metadata from G-code header + config
      const plateMetadata = {
        plateNumber,
        gcodePrintTimeSeconds: printTime,
        filamentUsedGrams: filamentWeight,
        totalLayers: layerCount,
        filamentUsedMm: this.parseFloat(
          metadata.total_filament_length_mm ||
          metadata.filament_length_mm ||
          metadata.filament_used_mm
        ),
        filamentUsedCm3: this.parseFloat(
          metadata.total_filament_volume_cm3 ||
          metadata.filament_volume_cm3
        ),
        filamentDensityGramsCm3: this.parseFloat(metadata.filament_density),
        filamentDiameterMm: this.parseFloat(metadata.filament_diameter) || 1.75,
        maxLayerZ: this.parseFloat(metadata.max_z_height || metadata.max_layer_z),
        slicerVersion: metadata.bambustudio || metadata.slicer_version || metadata.slicer || null,
        nozzleDiameterMm: this.parseFloat(metadata.nozzle_diameter),
        layerHeight: this.parseFloat(metadata.layer_height),
        firstLayerHeight: this.parseFloat(
          metadata.first_layer_height ||
          metadata.initial_layer_height ||
          metadata.initial_layer_print_height
        ),
        bedTemperature: this.parseFloat(
          metadata.bed_temperature_actual ||
          metadata.bed_temperature ||
          metadata.bed_temp ||
          metadata.bed_temperature_initial_layer
        ),
        nozzleTemperature: this.parseFloat(
          metadata.nozzle_temperature ||
          metadata.nozzle_temp ||
          metadata.nozzle_temperature_initial_layer
        ),
        fillDensity: metadata.sparse_infill_density || metadata.infill_density || metadata.fill_density || null,
        filamentType: metadata.filament_type || null,
        printerModel: metadata.printer_model || null,
        objects: [], // Could be extracted from 3dmodel.model XML
        thumbnails: plateThumbs.map(t => ({
          path: t.entryName,
          size: t.getData().length,
          type: t.entryName.endsWith(".png") ? "PNG" : "JPG",
        })),
      };

      plates.push(plateMetadata);
    }

    return plates.sort((a, b) => a.plateNumber - b.plateNumber);
  }

  private parseGCodeHeader(gcode: string): Record<string, string> {
    const metadata: Record<string, string> = {};
    const lines = gcode.split("\n").slice(0, 1000); // Extended to include CONFIG_BLOCK and early G-code

    for (const line of lines) {
      // Parse comment lines
      if (line.startsWith(";")) {
        // Skip block markers
        if (line.includes("_BLOCK_START") || line.includes("_BLOCK_END")) continue;

        // Special case: BambuStudio version (no key:value pattern)
        // ; BambuStudio 02.04.00.70
        const bambuMatch = line.match(/;\s*BambuStudio\s+([\d.]+)/i);
        if (bambuMatch) {
          metadata.bambustudio = `BambuStudio ${bambuMatch[1]}`;
          continue;
        }

        // Match patterns like:
        // ; key: value
        // ; key = value
        // ; key : value
        const match = line.match(/;\s*([^=:]+?)\s*[:=]\s*(.+)/);
        if (match) {
          let key = match[1].trim().toLowerCase().replace(/\s+/g, "_");
          let value = match[2].trim();

          // Remove bracketed units from key: "total_filament_weight_[g]" -> "total_filament_weight_g"
          // Also normalize special chars: [cm^3] -> cm3
          key = key.replace(/\[([^\]]+)\]/g, (_, unit) => unit.replace(/\^/g, ''));

          // Split value on semicolon and take first part (handles "11m 15s; total estimated time: 18m 15s")
          value = value.split(';')[0].trim();

          // Remove remaining bracketed units and percentages from value
          value = value.replace(/\s*\[.*?\]\s*/g, ''); // Remove [units]

          // Store the value (don't overwrite if already set from header)
          if (!metadata[key]) {
            metadata[key] = value;
          }
        }
      } else {
        // Parse actual G-code commands for temperatures
        // M140 S65 - Set bed temperature
        // M190 S65 - Wait for bed temperature
        if (!metadata.bed_temperature_actual) {
          const bedTempMatch = line.match(/^M1(40|90)\s+S(\d+)/);
          if (bedTempMatch && Number.parseInt(bedTempMatch[2]) > 0) {
            metadata.bed_temperature_actual = bedTempMatch[2];
          }
        }
      }
    }

    return metadata;
  }

  private extractThumbnails(zipEntries: AdmZip.IZipEntry[]): Array<{
    width: number;
    height: number;
    format: string;
    path?: string;
    data?: string;
  }> {
    const thumbnails: Array<any> = [];

    const thumbEntries = zipEntries.filter(e =>
      e.entryName.match(/Metadata\/.*\.(png|jpg|jpeg)/i) ||
      e.entryName.match(/Thumbnails\/.*/i)
    );

    for (const entry of thumbEntries) {
      // Try to extract dimensions from filename
      const sizeMatch = entry.entryName.match(/(\d+)x(\d+)/);
      const width = sizeMatch ? Number.parseInt(sizeMatch[1]) : 0;
      const height = sizeMatch ? Number.parseInt(sizeMatch[2]) : 0;

      const format = entry.entryName.match(/\.(png|jpg|jpeg)$/i)?.[1].toUpperCase() || "PNG";

      // Extract image data as base64
      const imageData = entry.getData();
      const base64Data = imageData.toString("base64");

      thumbnails.push({
        width,
        height,
        format,
        path: entry.entryName,
        data: base64Data, // Include base64-encoded image data
      });
    }

    return thumbnails;
  }

  private parseFloat(value: string | undefined): number | null {
    if (!value) return null;
    const num = Number.parseFloat(value);
    return Number.isNaN(num) ? null : num;
  }

  private parseInt(value: string | undefined): number | null {
    if (!value) return null;
    const num = Number.parseInt(value, 10);
    return Number.isNaN(num) ? null : num;
  }

  private parseTime(value: string | undefined): number | null {
    if (!value) return null;

    // Try parsing as a duration string first (e.g., "11m 15s" or "1h 30m")
    const match = value.match(/(?:(\d+)h)?(?:\s*(\d+)m)?(?:\s*(\d+)s)?/);
    if (match && (match[1] || match[2] || match[3])) {
      const hours = Number.parseInt(match[1] || "0");
      const minutes = Number.parseInt(match[2] || "0");
      const secs = Number.parseInt(match[3] || "0");
      return hours * 3600 + minutes * 60 + secs;
    }

    // Fallback to parsing as plain seconds
    const seconds = Number.parseFloat(value);
    if (!Number.isNaN(seconds)) return seconds;

    return null;
  }
}

