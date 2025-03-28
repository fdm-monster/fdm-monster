import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation, Unique } from "typeorm";
import { Printer } from "@/entities/printer.entity";
import { Group } from "@/entities/group.entity";

@Entity()
@Unique(["printerId", "groupId"])
export class PrinterGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Printer, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "printerId" })
  printer: Relation<Printer>;

  @Column()
  printerId: number;

  @ManyToOne(() => Group, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "groupId" })
  group: Relation<Group>;

  @Column()
  groupId: number;
}
