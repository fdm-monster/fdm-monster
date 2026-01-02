import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation, Unique } from "typeorm";
import { Printer } from "@/entities/printer.entity";
import { Tag } from "@/entities/tag.entity";

@Entity()
@Unique(["printerId", "tagId"])
export class PrinterTag {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Printer, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "printerId" })
  printer: Relation<Printer>;

  @Column()
  printerId: number;

  @ManyToOne(() => Tag, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "tagId" })
  tag: Relation<Tag>;

  @Column()
  tagId: number;
}
