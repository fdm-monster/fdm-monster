import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn
} from "typeorm";
import { Printer } from "@/entities/printer.entity";

// Job lifecycle states (printing/queue related only)
export type PrintJobStatus =
  | "PENDING"           // File uploaded, awaiting action
  | "QUEUED"           // In printer queue
  | "STARTING"         // Print job initializing
  | "PRINTING"         // Active print in progress
  | "PAUSED"           // Print paused by user/system
  | "COMPLETED"        // Print finished successfully
  | "FAILED"           // Print failed (hardware/material issue)
  | "CANCELLED"        // Print cancelled by user
  | "UNKNOWN";         // State unknown (disconnect/desync)

// File format types
export type FileFormatType = "gcode" | "3mf" | "bgcode";

// Analysis state
export type AnalysisState =
  | "NOT_ANALYZED"     // File not yet analyzed
  | "ANALYZING"        // Analysis in progress
  | "ANALYZED"         // Analysis complete
  | "FAILED";          // Analysis failed

// Base metadata interface
export interface BaseMetadata {
  // File information
  fileName: string;
  fileFormat: FileFormatType;
  fileSize?: number;

  // Print time estimates
  gcodePrintTimeSeconds: number | null;

  // Filament specification
  nozzleDiameterMm: number | null;
  filamentDiameterMm: number | null;
  filamentDensityGramsCm3: number | null;

  // Filament usage
  filamentUsedMm: number | null;
  filamentUsedCm3: number | null;
  filamentUsedGrams: number | null;
  totalFilamentUsedGrams: number | null;

  // Print settings
  layerHeight: number | null;
  firstLayerHeight: number | null;
  bedTemperature: number | null;
  nozzleTemperature: number | null;
  fillDensity: string | null;

  // Printer/Slicer info
  filamentType: string | null;
  printerModel: string | null;
  slicerVersion: string | null;
  maxLayerZ: number | null;
  totalLayers: number | null;
}

// G-code specific metadata
export interface GCodeMetadata extends BaseMetadata {
  fileFormat: "gcode";
  generatedBy?: string;
  thumbnails?: Array<{
    width: number;
    height: number;
    format: string;
    dataLength: number;
  }>;
}

// 3MF specific metadata (multi-plate support)
export interface ThreeMFMetadata extends BaseMetadata {
  fileFormat: "3mf";
  isMultiPlate: boolean;
  totalPlates: number;
  plateNumber?: number;  // Current plate if from multi-plate file
  sourceFile?: string;   // Original filename for plate grouping

  plates?: Array<{
    plateNumber: number;
    gcodePrintTimeSeconds: number | null;
    filamentUsedGrams: number | null;
    totalLayers: number | null;
    objects: Array<{
      name: string;
      bbox?: number[];
    }>;
    thumbnails?: Array<{
      path: string;
      size: number;
      type: string;
    }>;
  }>;
}

// BGCode specific metadata
export interface BGCodeMetadata extends BaseMetadata {
  fileFormat: "bgcode";
  producer?: string;
  producedOn?: string;
  checksumType?: string;

  thumbnails?: Array<{
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
}

// Union type for all metadata types
export type PrintJobMetadata = GCodeMetadata | ThreeMFMetadata | BGCodeMetadata;

// Thumbnail data
export interface ThumbnailData {
  width: number;
  height: number;
  format: string;  // PNG, JPG, QOI
  data?: string;   // Base64 encoded image data
  url?: string;    // URL if stored separately
}

// Print statistics (runtime tracking)
export interface PrintStatistics {
  startedAt: Date | null;
  endedAt: Date | null;
  actualPrintTimeSeconds: number | null;
  progress: number | null;  // 0-100

  // Failure tracking
  failureReason?: string;
  failureTime?: Date;

  // Multi-tool tracking
  toolChanges?: number;

  // Layer tracking
  currentLayer?: number;
  totalLayers?: number;
}

@Entity()
export class PrintJob {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Printer, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "printerId" })
  printer?: Relation<Printer>;
  @Column({ nullable: true })
  printerId: number | null;

  @Column({ type: "varchar", nullable: true })
  printerName: string | null;

  // File information
  @Column({ type: "varchar", nullable: false })
  fileName: string;

  @Column({ type: "varchar", nullable: true })
  fileStorageId: string | null; // ID in file storage system

  @Column({ type: "varchar", nullable: true })
  fileFormat: FileFormatType | null;

  @Column({ type: "int", nullable: true })
  fileSize: number | null;

  @Column({ type: "varchar", nullable: true })
  fileHash: string | null;  // SHA256 for deduplication

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: Date, nullable: true })
  analyzedAt: Date | null;

  @Column({ type: Date, nullable: true })
  startedAt: Date | null;

  @Column({ type: Date, nullable: true })
  endedAt: Date | null;

  // State management
  @Column({ type: "varchar", nullable: false, default: "PENDING" })
  status: PrintJobStatus;

  @Column({ type: "varchar", nullable: false, default: "NOT_ANALYZED" })
  analysisState: AnalysisState;

  @Column({ type: "varchar", nullable: true })
  statusReason: string | null;  // User-friendly reason for state

  // Progress tracking
  @Column({ type: "float", nullable: true })
  progress: number | null;

  // JSON Metadata (format-specific)
  @Column({ type: "json", nullable: true })
  metadata: PrintJobMetadata | null;

  // Runtime statistics
  @Column({ type: "json", nullable: true })
  statistics: PrintStatistics | null;

  // Queue management
  @Column({ type: "int", nullable: true })
  queuePosition: number | null;

  @Column({ type: "varchar", nullable: true })
  queueGroup: string | null;  // Group related plates/jobs overall or per printer
}
