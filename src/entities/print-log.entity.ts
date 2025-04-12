import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Printer } from "@/entities/printer.entity";
import { IPrintLog } from "@/models/PrintCompletion";

@Entity()
export class PrintLog implements IPrintLog<number, number> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fileName: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  endedAt: Date;

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
  printerName?: string;
}
