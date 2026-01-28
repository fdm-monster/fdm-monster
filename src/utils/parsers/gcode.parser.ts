import * as fs from "node:fs/promises";
import * as readline from "node:readline";
import { createReadStream } from "node:fs";
import { GCodeMetadata } from "@/entities/print-job.entity";
import { convertQoiToPng } from "../bgcode/bgcode-thumbnail.parser";

interface GCodeParseResult {
  raw: {
    _thumbnails?: Array<{
      width: number;
      height: number;
      format: string;
      data?: string;
    }>;
    metadata: Record<string, string>;
  };
  normalized: GCodeMetadata;
}

/**
 * G-code parser for extracting metadata from .gcode files
 * Reads first and last N lines to extract slicer metadata
 */
export class GCodeParser {
  private readonly maxHeaderLinesToRead = 500; // Read from start
  private readonly maxFooterLinesToRead = 500; // Read from end

  async parse(filePath: string): Promise<GCodeParseResult> {
    const stats = await fs.stat(filePath);
    const fileName = filePath.split(/[/\\]/).pop() || filePath;

    const metadata = await this.extractMetadata(filePath);
    const thumbnails = await this.extractThumbnails(filePath);

    const normalized: GCodeMetadata = {
      fileName,
      fileFormat: "gcode",
      fileSize: stats.size,
      gcodePrintTimeSeconds: this.parseTime(
        metadata.estimated_printing_time_normal_mode ||
        metadata.estimated_printing_time ||
        metadata.print_time
      ),
      nozzleDiameterMm: this.parseFloat(metadata.nozzle_diameter),
      filamentDiameterMm: this.parseFloat(metadata.filament_diameter),
      filamentDensityGramsCm3: this.parseFloat(metadata.filament_density),
      filamentUsedMm: this.parseFloat(metadata.filament_used_mm),
      filamentUsedCm3: this.parseFloat(metadata.filament_used_cm3),
      filamentUsedGrams: this.parseFloat(metadata.filament_used_g),
      totalFilamentUsedGrams: this.parseFloat(metadata.total_filament_used_g || metadata.filament_used_g),
      layerHeight: this.parseFloat(metadata.layer_height),
      firstLayerHeight: this.parseFloat(metadata.first_layer_height || metadata.initial_layer_height),
      bedTemperature: this.parseFloat(metadata.bed_temperature || metadata.first_layer_bed_temperature),
      nozzleTemperature: this.parseFloat(metadata.temperature || metadata.first_layer_temperature),
      fillDensity: metadata.fill_density || null,
      filamentType: metadata.filament_type || null,
      printerModel: metadata.printer_model || metadata.printer_name || null,
      slicerVersion: metadata.generated_by || metadata.slicer_version || null,
      maxLayerZ: this.parseFloat(metadata.max_layer_z),
      totalLayers: this.parseInt(metadata.total_layers) || this.parseInt(metadata.layer_count),
      generatedBy: metadata.generated_by,
      thumbnails: thumbnails.length > 0 ? thumbnails.map(t => ({
        width: t.width,
        height: t.height,
        format: t.format,
        dataLength: t.data?.length || 0,
      })) : undefined,
    };

    return {
      raw: {
        _thumbnails: thumbnails,
        metadata,
      },
      normalized,
    };
  }

  private async extractMetadata(filePath: string): Promise<Record<string, string>> {
    const metadata: Record<string, string> = {};

    // Read from start of file (header often has thumbnails and basic info)
    await this.extractMetadataFromStart(filePath, metadata);

    // Read from end of file (footer often has summary metadata - filament, time, etc.)
    await this.extractMetadataFromEnd(filePath, metadata);

    return metadata;
  }

  private async extractMetadataFromStart(filePath: string, metadata: Record<string, string>): Promise<void> {
    let linesRead = 0;

    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (linesRead >= this.maxHeaderLinesToRead) break;
      linesRead++;

      this.parseMetadataLine(line, metadata);
    }

    rl.close();
    fileStream.close();
  }

  private async extractMetadataFromEnd(filePath: string, metadata: Record<string, string>): Promise<void> {
    // Read last N lines efficiently
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;

    // Estimate bytes to read (assume ~50 bytes per line avg)
    const estimatedBytes = this.maxFooterLinesToRead * 50;
    const startPosition = Math.max(0, fileSize - estimatedBytes);

    const fileHandle = await fs.open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(estimatedBytes);
      const { bytesRead } = await fileHandle.read(buffer, 0, estimatedBytes, startPosition);
      const text = buffer.toString('utf8', 0, bytesRead);
      const lines = text.split('\n');

      // Process footer lines (summary metadata often here)
      for (const line of lines) {
        this.parseMetadataLine(line, metadata);
      }
    } finally {
      await fileHandle.close();
    }
  }

  private parseMetadataLine(line: string, metadata: Record<string, string>): void {
    // Skip non-comment lines
    if (!line.startsWith(";")) return;

    // Special case: "; generated by PrusaSlicer X.X.X on ..."
    const generatedByMatch = line.match(/^;\s*generated by\s+([^\s]+)/i);
    if (generatedByMatch && !metadata.generated_by) {
      metadata.generated_by = generatedByMatch[1];
      return;
    }

    // Parse PrusaSlicer/SuperSlicer format: "; key = value"
    const prusaMatch = line.match(/^;\s*([^=]+?)\s*=\s*(.+)$/);
    if (prusaMatch) {
      let key = prusaMatch[1].trim().toLowerCase().replace(/\s+/g, "_");
      let value = prusaMatch[2].trim();

      // Normalize bracketed units: "filament used [mm]" -> "filament_used_mm"
      key = key.replace(/\[([^\]]+)\]/g, (_, unit) => '_' + unit.replace(/\^/g, ''));
      // Normalize parentheses: "estimated printing time (normal mode)" -> "estimated_printing_time_normal_mode"
      key = key.replace(/\(([^)]+)\)/g, (_, content) => '_' + content.replace(/\s+/g, '_'));
      // Normalize multiple underscores
      key = key.replace(/_+/g, '_');

      // Don't overwrite if already set (header takes precedence)
      if (!metadata[key]) {
        metadata[key] = value.trim();
      }
      return;
    }

    // Parse Cura format: ";KEY:value"
    const curaMatch = line.match(/^;([A-Z_]+):(.+)$/);
    if (curaMatch) {
      const [, key, value] = curaMatch;
      const normalizedKey = key.toLowerCase();
      if (!metadata[normalizedKey]) {
        metadata[normalizedKey] = value.trim();
      }
      return;
    }

    // Parse Simplify3D format: "; key: value"
    const s3dMatch = line.match(/^;\s*([^:]+?):\s*(.+)$/);
    if (s3dMatch) {
      const [, key, value] = s3dMatch;
      const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, "_");
      if (!metadata[normalizedKey]) {
        metadata[normalizedKey] = value.trim();
      }
    }
  }

  private async extractThumbnails(filePath: string): Promise<Array<{
    width: number;
    height: number;
    format: string;
    data?: string;
  }>> {
    const thumbnails: Array<{ width: number; height: number; format: string; data?: string }> = [];
    let linesRead = 0;
    let inThumbnail = false;
    let thumbnailData: string[] = [];
    let currentWidth = 0;
    let currentHeight = 0;
    let currentFormat = "PNG";

    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (linesRead >= this.maxHeaderLinesToRead && !inThumbnail) break;
      linesRead++;

      // PrusaSlicer thumbnail format
      // Format 1: ; thumbnail begin 313x173 57100 (width x height dataLength)
      // Format 2: ; thumbnail begin 313x173 PNG (width x height format)
      const thumbnailStart = line.match(/;\s*thumbnail begin (\d+)x(\d+)\s*(\w+)?/i);
      if (thumbnailStart) {
        inThumbnail = true;
        currentWidth = parseInt(thumbnailStart[1]);
        currentHeight = parseInt(thumbnailStart[2]);

        // Third parameter could be format (PNG/JPG/QOI) or data length (number)
        const thirdParam = thumbnailStart[3];
        if (thirdParam && /^(PNG|JPG|JPEG|QOI)$/i.test(thirdParam)) {
          currentFormat = thirdParam.toUpperCase();
        } else {
          // If it's a number or not specified, default to PNG
          currentFormat = "PNG";
        }

        thumbnailData = [];
        continue;
      }

      if (inThumbnail) {
        if (line.match(/;\s*thumbnail end/i)) {
          let base64Data = thumbnailData.join("");
          let format = currentFormat.toUpperCase();

          if (format === "QOI") {
            try {
              const qoiBuffer = Buffer.from(base64Data, 'base64');
              const pngBuffer = convertQoiToPng(qoiBuffer);
              base64Data = pngBuffer.toString('base64');
              format = "PNG";
            } catch {
              // Keep original QOI if conversion fails
            }
          }

          thumbnails.push({
            width: currentWidth,
            height: currentHeight,
            format,
            data: base64Data,
          });
          inThumbnail = false;
          thumbnailData = [];
        } else if (line.startsWith(";")) {
          const data = line.substring(1).trim();
          if (data) {
            thumbnailData.push(data);
          }
        }
      }
    }

    rl.close();
    fileStream.close();

    return thumbnails;
  }

  private parseFloat(value: string | undefined): number | null {
    if (!value) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  private parseInt(value: string | undefined): number | null {
    if (!value) return null;
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }

  private parseTime(value: string | undefined): number | null {
    if (!value) return null;

    // Try parsing as duration string FIRST (e.g., "1h 31m 17s" or "19m 58s")
    const match = value.match(/(?:(\d+)h)?(?:\s*(\d+)m)?(?:\s*(\d+)s)?/);
    if (match && (match[1] || match[2] || match[3])) {
      const hours = parseInt(match[1] || "0");
      const minutes = parseInt(match[2] || "0");
      const secs = parseInt(match[3] || "0");
      return hours * 3600 + minutes * 60 + secs;
    }

    // Fallback to parsing as plain seconds
    const seconds = parseFloat(value);
    if (!isNaN(seconds)) return seconds;

    return null;
  }
}

