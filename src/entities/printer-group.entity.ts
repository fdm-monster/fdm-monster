import { Column, Entity, JoinColumn, ManyToOne, Relation, Unique } from "typeorm";
import { BaseEntity } from "@/entities/base.entity";
import { Printer } from "@/entities/printer.entity";
import { Group } from "@/entities/group.entity";

@Entity()
@Unique(["printerId", "groupId"])
export class PrinterGroup extends BaseEntity {
  @ManyToOne(() => Printer, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "printerId" })
  printer!: Relation<Printer>;

  @Column()
  printerId: number;

  @ManyToOne(() => Group, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "groupId" })
  group!: Relation<Group>;

  @Column()
  groupId: number;
}
