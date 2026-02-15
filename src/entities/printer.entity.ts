import { IsAlphanumeric } from "class-validator";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from "typeorm";
import { PrinterTag } from "@/entities/printer-tag.entity";
import { OctoprintType } from "@/services/printer-api.interface";

@Entity()
export class Printer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  printerURL: string;

  @Column({ default: OctoprintType, nullable: false })
  printerType: number;

  @Column({ default: "", nullable: true })
  @IsAlphanumeric()
  apiKey: string;

  @Column({ default: "", nullable: true })
  @IsAlphanumeric()
  username: string;

  @Column({ default: "", nullable: true })
  @IsAlphanumeric()
  password: string;

  @Column({
    nullable: false,
    default: true,
  })
  enabled: boolean;

  @Column({ type: "varchar", nullable: true })
  disabledReason: string | null;

  @Column({
    nullable: true,
  })
  assignee?: string;

  @OneToMany(
    () => PrinterTag,
    (pc) => pc.printer,
  )
  printerTags: Relation<PrinterTag>[];

  @CreateDateColumn({ type: "int" })
  dateAdded: number;

  @Column({ nullable: true })
  feedRate?: number;

  @Column({ nullable: true })
  flowRate?: number;
}
