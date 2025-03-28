import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CustomGcode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column("simple-array")
  gcode: string[];
}
