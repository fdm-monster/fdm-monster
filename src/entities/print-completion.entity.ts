import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Printer } from "@/entities/printer.entity";
import { BaseEntity } from "@/entities/base.entity";
import { PrintCompletionContextDto } from "@/services/interfaces/print-completion-context.dto";
import { Unique } from "typeorm/browser";

@Entity()
export class PrintCompletion extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fileName!: string;

  @CreateDateColumn({ type: "int" })
  createdAt!: number;

  @Column({ unique: false })
  correlationId!: string;

  @Column()
  status!: string;

  @ManyToOne(() => Printer, (p) => p.printCompletions, { onDelete: "SET NULL" })
  @JoinColumn({ name: "printerId" })
  printer!: Relation<Printer>;

  @Column({ nullable: false })
  printerId!: number;

  @Column({ nullable: true })
  printerReference?: string;

  @Column({ nullable: true })
  completionLog?: string;

  @Column({ type: "simple-json", nullable: true })
  context!: PrintCompletionContextDto;
}
