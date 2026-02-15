import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique, type Relation } from "typeorm";
import { Floor } from "./floor.entity";
import { Printer } from "./printer.entity";

@Entity()
@Unique(["x", "y", "floorId"])
export class FloorPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  x: number;

  @Column()
  y: number;

  // onDelete set null https://stackoverflow.com/questions/55098023/typeorm-cascade-option-cascade-ondelete-onupdate
  @ManyToOne(() => Floor, {
    onDelete: "CASCADE",
    nullable: false,
  })
  floor: Relation<Floor>;
  @Column()
  floorId: number;

  @OneToOne(() => Printer, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "printerId" })
  printer: Relation<Printer>;
  @Column()
  printerId: number;
}
