import { IsAlphanumeric } from "class-validator";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { PrintCompletion } from "@/entities/print-completion.entity";
import { BaseEntity } from "@/entities/base.entity";
import { PrinterFile } from "@/entities/printer-file.entity";
import { PrinterGroup } from "@/entities/printer-group.entity";

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

  @OneToMany(() => PrintCompletion, (pc) => pc.printer)
  printCompletions!: Relation<PrintCompletion>[];

  @OneToMany(() => PrinterGroup, (pc) => pc.printer)
  printerGroups!: Relation<PrinterGroup>[];

  @OneToMany(() => PrinterFile, (p) => p.printerId)
  printerFiles!: Relation<PrinterFile>[];

  @CreateDateColumn({ type: "int" })
  dateAdded!: number;

  @Column({ nullable: true })
  feedRate?: number;

  @Column({ nullable: true })
  flowRate?: number;
}
