import path from "node:path";
import { BGCodeMetadata } from "@/entities/print-job.entity";
import fs, { open } from "node:fs/promises";
import {
  parseFileHeader,
  parseBlockHeaders,
  getBlockData,
  decompressBlock,
  extractMetadataFromBlocks,
} from "../bgcode/bgcode.utils";
import {
  BgCodeBlockTypes,
  type BgCodeBlockHeader,
  type BgCodeThumbnailParameters,
  BgCodeBlockTypeName,
  BgCodeCompressionName,
} from "../bgcode/bgcode.types";
import { processThumbnail } from "../bgcode/bgcode-thumbnail.parser";

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

    const fileHandle = await open(filePath, "r");

    try {
      const { version, checksumType } = await parseFileHeader(fileHandle);
      if (version !== 1) {
        throw new Error(`Unsupported BGCode version: ${ version }`);
      }

      const blockHeaders = await parseBlockHeaders(fileHandle, stats.size, checksumType, true);

      const metadata = await extractMetadataFromBlocks(fileHandle, blockHeaders);
      const thumbnails = await this.extractThumbnailsFromBlocks(fileHandle, blockHeaders);

      const isMmu = this.isMmuData(metadata.nozzle_diameter) ||
        this.isMmuData(metadata.temperature) ||
        this.isMmuData(metadata.filament_used_mm) ||
        this.isMmuData(metadata.bed_temperature) ||
        this.isMmuData(metadata.filament_type, ';');

      const normalized: BGCodeMetadata = {
        fileName,
        fileFormat: "bgcode",
        fileSize: stats.size,
        producer: metadata.producer,
        producedOn: metadata.produced_on,
        checksumType: checksumType === 1 ? "CRC32" : "None",
        isMmu: isMmu || undefined,
        gcodePrintTimeSeconds: this.parseTime(metadata.estimated_printing_time_normal_mode || metadata.print_time),
        gcodePrintTimeSecondsSilent: this.parseTime(metadata.estimated_printing_time_silent_mode),
        nozzleDiameterMm: isMmu ? this.parseNumberArray(metadata.nozzle_diameter) : this.parseFirstValue(metadata.nozzle_diameter),
        filamentDiameterMm: isMmu ? this.parseNumberArray(metadata.filament_diameter) : (this.parseFirstValue(metadata.filament_diameter) || 1.75),
        filamentDensityGramsCm3: isMmu ? this.parseNumberArray(metadata.filament_density) : this.parseFirstValue(metadata.filament_density),
        filamentUsedMm: isMmu ? this.parseNumberArray(metadata.filament_used_mm) : this.parseFirstValue(metadata.filament_used_mm),
        filamentUsedCm3: isMmu ? this.parseNumberArray(metadata.filament_used_cm3) : this.parseFirstValue(metadata.filament_used_cm3),
        filamentUsedGrams: isMmu ? this.parseNumberArray(metadata.filament_used_g) : this.parseFirstValue(metadata.filament_used_g),
        totalFilamentUsedGrams: isMmu ? this.sumNumberArray(this.parseNumberArray(metadata.filament_used_g)) : this.parseFirstValue(metadata.filament_used_g),
        layerHeight: this.parseFloat(metadata.layer_height),
        firstLayerHeight: this.parseFloat(metadata.first_layer_height || metadata.initial_layer_height),
        bedTemperature: isMmu ? this.parseNumberArray(metadata.bed_temperature) : this.parseFirstValue(metadata.bed_temperature),
        nozzleTemperature: isMmu ? this.parseNumberArray(metadata.temperature) : this.parseFirstValue(metadata.temperature),
        fillDensity: metadata.fill_density || null,
        filamentType: isMmu ? this.parseStringArray(metadata.filament_type, ';') : this.parseFirstCsvValue(metadata.filament_type),
        printerModel: metadata.printer_model || null,
        slicerVersion: metadata.producer || null,
        maxLayerZ: this.parseFloat(metadata.max_layer_z),
        totalLayers: this.parseInt(metadata.total_layers || metadata.layer_count),
        thumbnails: thumbnails.length > 0 ? thumbnails.map(t => ({
          width: t.width,
          height: t.height,
          format: t.format,
          dataLength: t.data?.length || 0,
        })) : undefined,
        blocks: blockHeaders.map(b => ({
          type: BgCodeBlockTypeName[b.type] || `Unknown(${ b.type })`,
          compressedSize: b.compressedSize,
          uncompressedSize: b.uncompressedSize,
          compression: BgCodeCompressionName[b.compression] || `Unknown(${ b.compression })`,
        })),
      };

      return {
        raw: {
          _thumbnails: thumbnails,
          blocks: blockHeaders.map(b => ({
            type: BgCodeBlockTypeName[b.type] || `Unknown(${ b.type })`,
            compressedSize: b.compressedSize,
            uncompressedSize: b.uncompressedSize,
            compression: BgCodeCompressionName[b.compression] || `Unknown(${ b.compression })`,
          })),
        },
        normalized,
      };
    } finally {
      await fileHandle.close();
    }
  }

  private async extractThumbnailsFromBlocks(
    fileHandle: any,
    blockHeaders: BgCodeBlockHeader[]
  ): Promise<Array<{
    width: number;
    height: number;
    format: string;
    size: number;
    data?: string;
  }>> {
    const thumbnails: Array<any> = [];

    const thumbnailBlocks = blockHeaders.filter(b => b.type === BgCodeBlockTypes.Thumbnail);

    for (const header of thumbnailBlocks) {
      const parameters = header.parameters as BgCodeThumbnailParameters;

      const blockData = await getBlockData(fileHandle, header);
      const imageData = decompressBlock(header.compression, blockData);

      // Process thumbnail (converts QOI to PNG if needed)
      const processed = processThumbnail(imageData, parameters);
      const base64Data = processed.data.toString('base64');

      thumbnails.push({
        width: parameters.width,
        height: parameters.height,
        format: processed.extension,
        size: processed.data.length,
        data: base64Data,
      });
    }

    return thumbnails;
  }

  private parseNumber(value: string | undefined, parser: (val: string) => number): number | null {
    if (!value) return null;
    const num = parser(value);
    return Number.isNaN(num) ? null : num;
  }

  private parseFloat(value: string | undefined): number | null {
    return this.parseNumber(value, Number.parseFloat);
  }

  private parseInt(value: string | undefined): number | null {
    return this.parseNumber(value, (val) => Number.parseInt(val, 10));
  }

  private parseTime(value: string | undefined): number | null {
    if (!value) return null;

    let totalSeconds = 0;
    const hours = new RegExp(/(\d+)h/).exec(value);
    const minutes = new RegExp(/(\d+)m/).exec(value);
    const seconds = new RegExp(/(\d+)s/).exec(value);

    if (hours) totalSeconds += Number.parseInt(hours[1]) * 3600;
    if (minutes) totalSeconds += Number.parseInt(minutes[1]) * 60;
    if (seconds) totalSeconds += Number.parseInt(seconds[1]);

    if (hours || minutes || seconds) return totalSeconds;

    const num = Number.parseFloat(value);
    return Number.isNaN(num) ? null : num;
  }

  private parseFirstValue(value: string | undefined): number | null {
    if (!value) return null;

    const firstValue = value.split(',')[0].trim();
    const num = Number.parseFloat(firstValue);
    return Number.isNaN(num) ? null : num;
  }

  private parseFirstCsvValue(value: string | undefined): string | null {
    if (!value) return null;
    return value.trim();
  }

  private parseNumberArray(value: string | undefined): number[] | null {
    if (!value) return null;
    const values = value.split(',').map(v => Number.parseFloat(v.trim())).filter(n => !Number.isNaN(n));
    return values.length > 0 ? values : null;
  }

  private parseStringArray(value: string | undefined, separator: string = ';'): string[] | null {
    if (!value) return null;
    const values = value.split(separator).map(v => v.trim()).filter(v => v.length > 0);
    return values.length > 0 ? values : null;
  }

  private isMmuData(value: string | undefined, separator: string = ','): boolean {
    if (!value) return false;
    const parts = value.split(separator).map(v => v.trim()).filter(v => v.length > 0);
    return parts.length > 1;
  }

  private sumNumberArray(values: number[] | null): number | null {
    if (!values || values.length === 0) return null;
    return values.reduce((sum, val) => sum + val, 0);
  }
}
