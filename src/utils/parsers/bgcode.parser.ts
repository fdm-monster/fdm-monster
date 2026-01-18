import * as fs from "fs/promises";
import * as path from "path";
import * as zlib from "zlib";
import { promisify } from "util";
import { HeatshrinkDecoder } from "@/utils/heatshrink-decoder";
import { MeatPackDecoder } from "@/utils/meatpack-decoder";
import { BGCodeMetadata } from "@/entities/print-job.entity";

const inflateAsync = promisify(zlib.inflate);

interface BGCodeBlock {
  type: number;
  typeName: string;
  compression: number;
  compressionName: string;
  uncompressedSize: number;
  compressedSize: number;
  data?: Buffer;
}

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
  gcode?: string;
}

/**
 * BGCode parser for extracting metadata from .bgcode files
 * BGCode is a binary G-code format used by Prusa printers
 */
export class BGCodeParser {
  async parse(filePath: string, extractGCode: boolean = false): Promise<BGCodeParseResult> {
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);

    // Read entire file for full parsing
    const fullBuffer = await fs.readFile(filePath);

    // Parse BGCode file header (10 bytes)
    const fileHeader = this.parseFileHeader(fullBuffer);

    // Parse all blocks
    const blocks = await this.parseAllBlocks(fullBuffer, fileHeader);

    // Extract metadata from metadata blocks
    const metadata = this.extractMetadataFromBlocks(blocks);
    const thumbnails = this.extractThumbnailsFromBlocks(blocks);

    // Extract G-code if requested
    let gcode: string | undefined;
    if (extractGCode) {
      gcode = this.extractGCodeFromBlocks(blocks);
    }

    const normalized: BGCodeMetadata = {
      fileName,
      fileFormat: "bgcode",
      fileSize: stats.size,
      producer: metadata.producer,
      producedOn: metadata.produced_on,
      checksumType: fileHeader.checksumType === 1 ? "CRC32" : "None",
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
      blocks: blocks.map(b => ({
        type: b.typeName,
        compressedSize: b.compressedSize,
        uncompressedSize: b.uncompressedSize,
        compression: b.compressionName,
      })),
    };

    return {
      raw: {
        _thumbnails: thumbnails,
        blocks: blocks.map(b => ({
          type: b.typeName,
          compressedSize: b.compressedSize,
          uncompressedSize: b.uncompressedSize,
          compression: b.compressionName,
        })),
      },
      normalized,
      gcode,
    };
  }

  private parseFileHeader(buffer: Buffer): { magic: string; version: number; checksumType: number } {
    // Validate we have at least the header
    if (buffer.length < 10) {
      throw new Error("File too small to be a valid BGCode file");
    }

    const magic = buffer.toString("ascii", 0, 4);
    if (magic !== "GCDE") {
      throw new Error(`Invalid BGCode file: magic number not found (got "${magic}", expected "GCDE")`);
    }

    const version = buffer.readUInt32LE(4);
    const checksumType = buffer.readUInt16LE(8);

    return { magic, version, checksumType };
  }

  private async parseAllBlocks(buffer: Buffer, fileHeader: { checksumType: number }): Promise<BGCodeBlock[]> {
    const blocks: BGCodeBlock[] = [];
    let offset = 10; // Start after the 10-byte file header

    while (offset < buffer.length) {
      try {
        const block = await this.parseBlock(buffer, offset, fileHeader.checksumType);
        blocks.push(block);

        // Calculate next offset
        const headerSize = block.compression > 0 ? 12 : 8;
        const checksumSize = fileHeader.checksumType === 1 ? 4 : 0;

        // Parameter sizes based on block type
        let paramSize = 0;
        if (block.type === 5) { // Thumbnail
          paramSize = 6; // format (2) + width (2) + height (2)
        } else if (block.type >= 0 && block.type <= 4) { // Metadata and GCode
          paramSize = 2; // encoding parameter
        }

        // Data size is the compressed size if compressed, otherwise uncompressed size
        const dataSize = block.compressedSize > 0 ? block.compressedSize : block.uncompressedSize;

        // Total block size = header + parameters + data + checksum
        const totalBlockSize = headerSize + paramSize + dataSize + checksumSize;

        offset += totalBlockSize;
      } catch (error: any) {
        // End of valid blocks
        break;
      }
    }

    return blocks;
  }

  private async parseBlock(buffer: Buffer, offset: number, checksumType: number): Promise<BGCodeBlock & { encoding?: number }> {
    if (offset + 8 > buffer.length) {
      throw new Error("Not enough data for block header");
    }

    // Read block header
    const type = buffer.readUInt16LE(offset);
    const compression = buffer.readUInt16LE(offset + 2);
    const uncompressedSize = buffer.readUInt32LE(offset + 4);

    let compressedSize = 0;
    let headerSize = 8;

    if (compression > 0) {
      if (offset + 12 > buffer.length) {
        throw new Error("Not enough data for compressed block header");
      }
      compressedSize = buffer.readUInt32LE(offset + 8);
      headerSize = 12;
    }

    // Get block type and compression names
    const typeName = this.getBlockTypeName(type);
    const compressionName = this.getCompressionName(compression);

    // Read block parameters and data
    let dataOffset = offset + headerSize;
    let dataSize = compressedSize || uncompressedSize;
    let encoding: number | undefined;

    // Read and skip parameter bytes based on block type
    if (type === 5) { // Thumbnail
      dataOffset += 6; // format (2) + width (2) + height (2)
    } else if (type >= 0 && type <= 4) { // Metadata and GCode blocks
      encoding = buffer.readUInt16LE(offset + headerSize);
      dataOffset += 2; // encoding parameter
    }

    // Read and decompress data if needed
    let data: Buffer | undefined;
    if (dataOffset + dataSize <= buffer.length) {
      const rawData = buffer.subarray(dataOffset, dataOffset + dataSize);

      if (compression > 0) {
        data = await this.decompressBlock(rawData, compression, uncompressedSize);
      } else {
        data = rawData;
      }

      // Decode MeatPack if this is a G-code block with encoding
      if (type === 1 && encoding !== undefined && encoding > 0 && data) {
        data = this.decodeGCode(data, encoding);
      }
    }

    return {
      type,
      typeName,
      compression,
      compressionName,
      uncompressedSize,
      compressedSize,
      data,
      encoding,
    };
  }

  private async decompressBlock(data: Buffer, compression: number, uncompressedSize: number): Promise<Buffer> {
    switch (compression) {
      case 1: // Deflate
        return await inflateAsync(data);

      case 2: // Heatshrink 11_4
        return this.heatshrinkDecompress(data, 11, 4);

      case 3: // Heatshrink 12_4
        return this.heatshrinkDecompress(data, 12, 4);

      default:
        throw new Error(`Unsupported compression type: ${compression}`);
    }
  }

  private heatshrinkDecompress(data: Buffer, windowBits: number, lookaheadBits: number): Buffer {
    const decoder = new HeatshrinkDecoder(windowBits, lookaheadBits);
    return decoder.decompress(data);
  }

  private decodeGCode(data: Buffer, encoding: number): Buffer {
    if (encoding === 0) {
      // No encoding - return as-is
      return data;
    } else if (encoding === 1 || encoding === 2) {
      // MeatPack encoding (1 = standard, 2 = with comment preservation)
      const decoder = new MeatPackDecoder();
      const decoded = decoder.decode(data);
      return Buffer.from(decoded, 'utf8');
    } else {
      throw new Error(`Unsupported G-code encoding: ${encoding}`);
    }
  }

  private getBlockTypeName(type: number): string {
    const types = ["FileMetadata", "GCode", "SlicerMetadata", "PrinterMetadata", "PrintMetadata", "Thumbnail"];
    return types[type] || `Unknown(${type})`;
  }

  private getCompressionName(compression: number): string {
    const compressions = ["None", "Deflate", "Heatshrink_11_4", "Heatshrink_12_4"];
    return compressions[compression] || `Unknown(${compression})`;
  }

  private extractMetadataFromBlocks(blocks: BGCodeBlock[]): Record<string, string> {
    const metadata: Record<string, string> = {};

    // Look for metadata blocks (types 0, 2, 3, 4)
    const metadataBlocks = blocks.filter(b => [0, 2, 3, 4].includes(b.type));

    for (const block of metadataBlocks) {
      if (block.data) {
        const text = block.data.toString("utf8");
        this.extractMetadataFromText(text, metadata);
      }
    }

    return metadata;
  }

  private extractThumbnailsFromBlocks(blocks: BGCodeBlock[]): Array<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    const thumbnails: Array<any> = [];

    // Look for thumbnail blocks (type 5)
    const thumbnailBlocks = blocks.filter(b => b.type === 5);

    for (const block of thumbnailBlocks) {
      if (block.data) {
        thumbnails.push({
          width: 0, // Would need to parse from block parameters
          height: 0,
          format: "Unknown",
          size: block.data.length,
        });
      }
    }

    return thumbnails;
  }

  private extractGCodeFromBlocks(blocks: BGCodeBlock[]): string {
    // Look for GCode blocks (type 1)
    const gcodeBlocks = blocks.filter(b => b.type === 1);

    if (gcodeBlocks.length === 0) {
      return "";
    }

    // Concatenate all G-code blocks
    const gcodeBuffers = gcodeBlocks.map(b => b.data).filter((d): d is Buffer => d !== undefined);
    const combinedBuffer = Buffer.concat(gcodeBuffers);

    return combinedBuffer.toString("utf8");
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

