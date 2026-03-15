import { PrintJobMetadata, FileFormatType, ThumbnailData } from "@/entities/print-job.entity";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { GCodeParser } from "@/utils/parsers/gcode.parser";
import { ThreeMFParser } from "@/utils/parsers/3mf.parser";
import { BGCodeParser } from "@/utils/parsers/bgcode.parser";
import { basename, extname } from "node:path";
import { access } from "node:fs/promises";

interface ParserResult {
  raw: any;
  normalized: any;
  plates?: any[];
}

/**
 * Service for analyzing print files and extracting metadata
 * Supports G-code, 3MF (including multi-plate), and BGCode formats
 */
export class FileAnalysisService {
  private readonly logger: LoggerService;

  // File format constants
  private readonly FILE_FORMATS = {
    GCODE: "gcode" as const,
    THREE_MF: "3mf" as const,
    BGCODE: "bgcode" as const,
  };

  // File extension constants
  private readonly EXTENSIONS = {
    THREE_MF: ".3mf",
    BGCODE: ".bgcode",
    GCODE: ".gcode",
    GCODE_SHORT: ".g",
    GCODE_ALT: ".gco",
    GCODE_THREE_MF: ".gcode.3mf",
  };

  // Parser instances
  private readonly gcodeParser: GCodeParser;
  private readonly threemfParser: ThreeMFParser;
  private readonly bgcodeParser: BGCodeParser;

  constructor(loggerFactory: ILoggerFactory) {
    this.logger = loggerFactory(FileAnalysisService.name);
    this.gcodeParser = new GCodeParser();
    this.threemfParser = new ThreeMFParser();
    this.bgcodeParser = new BGCodeParser();
    this.logger.log("File analysis service initialized with all parsers");
  }

  /**
   * Analyze a file and extract metadata
   */
  async analyzeFile(filePath: string): Promise<{
    metadata: PrintJobMetadata;
    thumbnails: ThumbnailData[];
  }> {
    const ext = extname(filePath).toLowerCase();
    const fileFormat = this.getFileFormat(ext, filePath);

    this.logger.log(`Analyzing file: ${basename(filePath)} (format: ${fileFormat}, ext: ${ext})`);

    let result: ParserResult;

    try {
      switch (fileFormat) {
        case this.FILE_FORMATS.GCODE:
          result = await this.analyzeGCode(filePath);
          break;
        case this.FILE_FORMATS.THREE_MF:
          result = await this.analyze3MF(filePath);
          break;
        case this.FILE_FORMATS.BGCODE:
          result = await this.analyzeBGCode(filePath);
          break;
        default:
          throw new Error(`Unsupported file format: ${fileFormat}`);
      }

      // Extract thumbnails
      const thumbnails = this.extractThumbnails(result);

      return {
        metadata: result.normalized as PrintJobMetadata,
        thumbnails,
      };
    } catch (error) {
      this.logger.error(`Failed to analyze file ${filePath} (ext: "${ext}"): ${error}`);
      throw error;
    }
  }

  /**
   * Analyze multiple plates from a 3MF file
   * Returns array of metadata objects, one per plate
   */
  async analyzeMultiPlate3MF(filePath: string): Promise<
    Array<{
      metadata: PrintJobMetadata;
      thumbnails: ThumbnailData[];
    }>
  > {
    const result = await this.analyze3MF(filePath);

    if (!result.normalized.isMultiPlate || !result.plates) {
      // Single plate file
      return [
        {
          metadata: result.normalized as PrintJobMetadata,
          thumbnails: this.extractThumbnails(result),
        },
      ];
    }

    // Multi-plate file - return metadata for each plate
    return result.plates.map((plate) => ({
      metadata: {
        ...result.normalized,
        plateNumber: plate.plateNumber,
        gcodePrintTimeSeconds: plate.gcodePrintTimeSeconds,
        filamentUsedGrams: plate.filamentUsedGrams,
        totalLayers: plate.totalLayers,
      } as PrintJobMetadata,
      thumbnails:
        plate.thumbnails?.map((t: any) => ({
          width: t.width || 0,
          height: t.height || 0,
          format: t.type || t.format || "PNG",
        })) || [],
    }));
  }

  private async analyzeGCode(filePath: string): Promise<ParserResult> {
    return await this.gcodeParser.parse(filePath);
  }

  private async analyze3MF(filePath: string): Promise<ParserResult> {
    return await this.threemfParser.parse(filePath);
  }

  private async analyzeBGCode(filePath: string): Promise<ParserResult> {
    return await this.bgcodeParser.parse(filePath);
  }

  private extractThumbnails(result: ParserResult): ThumbnailData[] {
    const thumbnails: ThumbnailData[] = [];

    if (result.raw._thumbnails) {
      for (const thumb of result.raw._thumbnails) {
        thumbnails.push({
          width: thumb.width,
          height: thumb.height,
          format: thumb.format,
          data: thumb.data, // Base64 if available
        });
      }
    }

    return thumbnails;
  }

  private getFileFormat(ext: string, filePath: string): FileFormatType {
    // Check for compound extensions first
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.endsWith(this.EXTENSIONS.GCODE_THREE_MF) || lowerPath.endsWith(this.EXTENSIONS.THREE_MF)) {
      return this.FILE_FORMATS.THREE_MF;
    }
    if (lowerPath.endsWith(this.EXTENSIONS.BGCODE)) {
      return this.FILE_FORMATS.BGCODE;
    }
    if (
      lowerPath.endsWith(this.EXTENSIONS.GCODE) ||
      lowerPath.endsWith(this.EXTENSIONS.GCODE_SHORT) ||
      lowerPath.endsWith(this.EXTENSIONS.GCODE_ALT)
    ) {
      return this.FILE_FORMATS.GCODE;
    }

    // Fallback to extension check
    if (ext === this.EXTENSIONS.THREE_MF) return this.FILE_FORMATS.THREE_MF;
    if (ext === this.EXTENSIONS.BGCODE) return this.FILE_FORMATS.BGCODE;
    if (ext === this.EXTENSIONS.GCODE || ext === this.EXTENSIONS.GCODE_SHORT || ext === this.EXTENSIONS.GCODE_ALT) {
      return this.FILE_FORMATS.GCODE;
    }

    throw new Error(`Unknown file extension: "${ext}" (path: "${filePath}")`);
  }

  /**
   * Quick check if file needs analysis
   */
  async needsAnalysis(filePath: string): Promise<boolean> {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
