import { IsAlphanumeric } from "class-validator";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { FloorPosition } from "./floor-position.entity";
import { PrintCompletion } from "@/entities/print-completion.entity";
import { BaseEntity } from "@/entities/base.entity";
import { PrinterFile } from "@/entities/printer-file.entity";

@Entity()
export class Printer extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  printerURL!: string;

  @Column()
  @IsAlphanumeric()
  apiKey!: string;

  @Column({
    nullable: false,
    default: true,
  })
  enabled: boolean = true;

  @Column({
    nullable: true,
  })
  disabledReason?: string;

  @Column({
    nullable: true,
  })
  assignee?: string;

  @OneToOne(() => FloorPosition, (fp) => fp.printer, {
    eager: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "floorPositionId" })
  floorPosition?: Relation<FloorPosition>;
  @Column({ nullable: true })
  floorPositionId!: number;

  @OneToMany(() => PrintCompletion, (pc) => pc.printer)
  printCompletions!: Relation<PrintCompletion>[];

  @OneToMany(() => PrinterFile, (p) => p.printerId)
  printerFiles!: Relation<PrinterFile>[];

  @CreateDateColumn({ type: "int" })
  dateAdded!: number;

  @Column({ nullable: true })
  feedRate?: number;

  @Column({ nullable: true })
  flowRate?: number;
}
