import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { FloorPosition } from "./floor-position.entity";
import { BaseEntity } from "@/entities/base.entity";

@Entity()
export class Floor extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({
    unique: true,
  })
  floor!: number;

  @OneToMany(() => FloorPosition, (gp) => gp.floor, { eager: true })
  printers!: Relation<FloorPosition>[];
}
