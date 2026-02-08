import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { FloorPosition } from "./floor-position.entity";

@Entity()
export class Floor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  order: number;

  @OneToMany(
    () => FloorPosition,
    (gp) => gp.floor,
    { eager: true },
  )
  printers: Relation<FloorPosition>[];
}
