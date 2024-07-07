import { BaseEntity } from "@/entities/base.entity";
import { Column, Entity, JoinColumn, ManyToOne, Relation } from "typeorm";
import { GcodeAnalysisDto } from "@/services/interfaces/gcode-analysis.dto";
import { Prints, Refs, OctoPrintStatisticsDto } from "@/services/interfaces/printer-file.dto";
import { Printer } from "@/entities/printer.entity";
import { OctoPrintCustomDto } from "@/services/octoprint/dto/files/octoprint-file.dto";

/**
 * @deprecated This entity will be removed, or reshaped and is unused right now.
 */
@Entity()
export class PrinterFile extends BaseEntity {
  @ManyToOne(() => Printer, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "printerId" })
  printer!: Relation<Printer>;

  @Column()
  printerId: number;

  @Column()
  name: string;

  @Column()
  date: number;

  @Column()
  display: string;

  @Column({ type: "simple-json", nullable: true })
  gcodeAnalysis?: GcodeAnalysisDto;

  @Column()
  hash: string;

  @Column()
  origin: string;

  @Column()
  path: string;

  @Column({ type: "simple-json", nullable: true })
  prints?: Prints;

  @Column({ type: "simple-json", nullable: true })
  refs?: Refs;

  @Column({ nullable: true })
  size: number;

  @Column({ type: "simple-json", nullable: true })
  statistics?: OctoPrintStatisticsDto;

  @Column({ nullable: true })
  type?: string;

  @Column({ type: "simple-array", nullable: true })
  typePath?: string[]; // machinecode gcode

  @Column({ type: "simple-json", nullable: false })
  customData: OctoPrintCustomDto;
}
