import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Printer } from "@/entities/printer.entity";
import { User } from "@/entities/user.entity";

@Entity()
@Index(["printerId"], { unique: true, where: "completed = 0" })
export class PrinterMaintenanceLog {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;
  @Column({ nullable: false })
  createdBy: string;
  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  createdByUser: User | null;
  @Column({ nullable: true })
  createdByUserId: number | null;

  @ManyToOne(() => Printer, { onDelete: "SET NULL", nullable: true })
  printer: Printer | null;
  @Column({ nullable: true })
  printerId: number | null;
  @Column({ nullable: false })
  printerName: string;
  @Column({ nullable: false })
  printerUrl: string;

  @Column({ nullable: false, type: "json", default: "{}" })
  metadata: {
    partsInvolved?: string[];
    cause?: string;
    notes?: string;
    completionNotes?: string;
  };

  @Column({ nullable: false, default: false })
  completed: boolean;
  @Column({ nullable: true })
  completedAt?: Date;
  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  completedByUser: User | null;
  @Column({ nullable: true })
  completedByUserId: number | null;
  @Column({ nullable: true })
  completedBy?: string;
}
