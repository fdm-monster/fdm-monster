import * as fs from "fs/promises";
import * as path from "path";
import { BGCodeMetadata } from "@/entities/print-job.entity";

interface BGCodeParseResult {
  raw: {
    _thumbnails?: Array<{
      width: number;
      height: number;
      format: string;
      size: number;
    }>;
    blocks?: Array<{
      type: string;
      compressedSize: number;
      uncompressedSize: number;
      compression: string;
    }>;
  };
  normalized: BGCodeMetadata;
}

/**
 * BGCode parser for extracting metadata from .bgcode files
 * BGCode is a binary G-code format used by Prusa printers
 */
export class BGCodeParser {
  async parse(filePath: string): Promise<BGCodeParseResult> {
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);

    // Read file header (first 4KB should contain metadata)
    const buffer = await this.readFileHeader(filePath, 4096);

    // Parse BGCode header
    const metadata = this.parseHeader(buffer);
    const blocks = this.parseBlocks(buffer);
    const thumbnails = this.extractThumbnails(buffer);

    const normalized: BGCodeMetadata = {
      fileName,
      fileFormat: "bgcode",
      fileSize: stats.size,
      producer: metadata.producer,
      producedOn: metadata.produced_on,
      checksumType: metadata.checksum_type,
      gcodePrintTimeSeconds: this.parseTime(
        metadata.estimated_printing_time_normal_mode ||
        metadata.estimated_printing_time ||
        metadata.print_time
      ),
      nozzleDiameterMm: this.parseFirstValue(metadata.nozzle_diameter),
      filamentDiameterMm: this.parseFirstValue(metadata.filament_diameter) || 1.75,
      filamentDensityGramsCm3: this.parseFirstValue(metadata.filament_density),
      filamentUsedMm: this.parseFirstValue(metadata.filament_used_mm),
      filamentUsedCm3: this.parseFirstValue(metadata.filament_used_cm3),
      filamentUsedGrams: this.parseFirstValue(metadata.filament_used_g),
      totalFilamentUsedGrams: this.parseFirstValue(metadata.filament_used_g),
      layerHeight: this.parseFloat(metadata.layer_height),
      firstLayerHeight: this.parseFloat(metadata.first_layer_height || metadata.initial_layer_height),
      bedTemperature: this.parseFirstValue(metadata.bed_temperature),
      nozzleTemperature: this.parseFirstValue(metadata.temperature),
      fillDensity: metadata.fill_density || null,
      filamentType: this.parseFirstCsvValue(metadata.filament_type),
      printerModel: metadata.printer_model || null,
      slicerVersion: metadata.producer || null,
      maxLayerZ: this.parseFloat(metadata.max_layer_z),
      totalLayers: this.parseInt(metadata.total_layers || metadata.layer_count),
      thumbnails: thumbnails.length > 0 ? thumbnails : undefined,
      blocks: blocks.length > 0 ? blocks : undefined,
    };

    return {
      raw: {
        _thumbnails: thumbnails,
        blocks,
      },
      normalized,
    };
  }

  private async readFileHeader(filePath: string, bytes: number): Promise<Buffer> {
    const fileHandle = await fs.open(filePath, "r");
    try {
      const buffer = Buffer.alloc(bytes);
      await fileHandle.read(buffer, 0, bytes, 0);
      return buffer;
    } finally {
      await fileHandle.close();
    }
  }

  private parseHeader(buffer: Buffer): Record<string, string> {
    const metadata: Record<string, string> = {};

    // BGCode magic number check (GCDE for newer files, BGCD for older)
    const magic = buffer.toString("ascii", 0, 4);
    if (magic !== "GCDE" && magic !== "BGCD") {
      throw new Error(`Invalid BGCode file: magic number not found (got "${magic}", expected "GCDE" or "BGCD")`);
    }

    // Version
    const version = buffer.readUInt32LE(4);
    metadata.version = version.toString();

    // Try to find metadata block (simplified parsing)
    // In real implementation, we'd properly parse the block structure
    const headerText = buffer.toString("utf8", 0, Math.min(buffer.length, 2048));

    // Extract common metadata patterns
    this.extractMetadataFromText(headerText, metadata);

    return metadata;
  }

  private extractMetadataFromText(text: string, metadata: Record<string, string>): void {
    // BGCode stores metadata as key=value pairs in the header
    const lines = text.split('\n');

    // Also capture Producer from binary header before newlines
    const producerMatch = text.match(/Producer=([^\n\r\0]+)/);
    if (producerMatch) {
      metadata.producer = producerMatch[1].trim();
    }

    for (const line of lines) {
      // Match key=value pattern
      const match = line.match(/^([a-z_\s]+(?:\[[^\]]+\])?(?:\([^)]+\))?)\s*=\s*(.+)/i);
      if (match) {
        let key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
        let value = match[2].trim();

        // Remove parentheses content: "estimated printing time (normal mode)" -> "estimated_printing_time_normal_mode"
        key = key.replace(/\(([^)]+)\)/g, (_, content) => '_' + content.replace(/\s+/g, '_'));

        // Remove bracketed units from key: "filament used [mm]" -> "filament_used_mm"
        key = key.replace(/\[([^\]]+)\]/g, (_, unit) => '_' + unit.replace(/\^/g, ''));

        // Normalize multiple underscores to single
        key = key.replace(/_+/g, '_');

        // Store the value
        metadata[key] = value;
      }
    }

    // Also look for specific patterns as fallback
    const patterns = [
      /producer[=:]\s*([^\n\r]+)/i,
      /produced[\s_]on[=:]\s*([^\n\r]+)/i,
      /print[\s_]time[=:]\s*([^\n\r]+)/i,
      /layer[\s_]height[=:]\s*([^\n\r]+)/i,
      /nozzle_diameter[=:]\s*([^\n\r]+)/i,
      /bed_temperature[=:]\s*([^\n\r]+)/i,
      /nozzle_temperature[=:]\s*([^\n\r]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const key = pattern.source.match(/^(\w+)/)?.[1] || "";
        metadata[key] = match[1].trim();
      }
    }
  }

  private parseBlocks(buffer: Buffer): Array<{
    type: string;
    compressedSize: number;
    uncompressedSize: number;
    compression: string;
  }> {
    const blocks: Array<any> = [];

    // Simplified block parsing
    // In real implementation, we'd parse the full block table
    try {
      let offset = 8; // After magic + version
      const blockCount = Math.min(buffer.readUInt16LE(offset), 10); // Limit to 10 blocks

      for (let i = 0; i < blockCount; i++) {
        // This is a simplified example - real BGCode has complex structure
        blocks.push({
          type: `Block${i}`,
          compressedSize: 0,
          uncompressedSize: 0,
          compression: "unknown",
        });
      }
    } catch (error) {
      // Ignore parsing errors for blocks
    }

    return blocks;
  }

  private extractThumbnails(buffer: Buffer): Array<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    const thumbnails: Array<any> = [];

    // BGCode can contain embedded thumbnails (usually PNG or QOI format)
    // This is a simplified implementation
    try {
      // Look for PNG magic bytes
      for (let i = 0; i < buffer.length - 8; i++) {
        if (buffer[i] === 0x89 && buffer[i + 1] === 0x50 &&
            buffer[i + 2] === 0x4E && buffer[i + 3] === 0x47) {
          // Found PNG signature
          thumbnails.push({
            width: 0,  // Would need to parse PNG header
            height: 0,
            format: "PNG",
            size: 0,
          });
          break; // Only find first thumbnail for now
        }
      }
    } catch (error) {
      // Ignore thumbnail extraction errors
    }

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

    // Try parsing as a duration string first (e.g., "19m 58s" or "1h 30m")
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

  /**
   * Parse first value from comma-separated list and convert to number
   * "2067.90, 0.00, 0.00" -> 2067.90
   */
  private parseFirstValue(value: string | undefined): number | null {
    if (!value) return null;

    const firstValue = value.split(',')[0].trim();
    const num = parseFloat(firstValue);
    return isNaN(num) ? null : num;
  }

  /**
   * Parse first value from semicolon or comma-separated list
   * "PLA;PLA;PLA" -> "PLA"
   */
  private parseFirstCsvValue(value: string | undefined): string | null {
    if (!value) return null;

    const firstValue = value.split(/[;,]/)[0].trim();
    return firstValue || null;
  }
}

