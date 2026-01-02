import { IsAlphanumeric } from "class-validator";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { PrinterGroup } from "@/entities/printer-group.entity";
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

  @Column({
    nullable: true,
  })
  disabledReason?: string;

  @Column({
    nullable: true,
  })
  assignee?: string;

  @OneToMany(
    () => PrinterGroup,
    (pc) => pc.printer,
  )
  printerGroups: Relation<PrinterGroup>[];

  @CreateDateColumn({ type: "int" })
  dateAdded: number;

  @Column({ nullable: true })
  feedRate?: number;

  @Column({ nullable: true })
  flowRate?: number;
}
