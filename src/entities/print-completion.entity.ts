import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Printer } from "@/entities/printer.entity";
import { PrintCompletionContextDto } from "@/services/interfaces/print-completion-context.dto";
import { IPrintCompletion } from "@/models/PrintCompletion";

@Entity()
export class PrintCompletion implements IPrintCompletion<number, number> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fileName: string;

  @CreateDateColumn({ type: "int" })
  createdAt: number;

  @Column()
  status: string;

  @ManyToOne(
    () => Printer,
    (p) => p.printCompletions,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "printerId" })
  printer: Relation<Printer>;

  @Column({ nullable: false })
  printerId: number;

  @Column({ nullable: true })
  printerReference?: string;

  @Column({ nullable: true })
  completionLog?: string;

  @Column({ type: "simple-json", nullable: true })
  context: PrintCompletionContextDto;
}
