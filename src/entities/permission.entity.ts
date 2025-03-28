import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

// TODO unfinished and uncoupled from the rest of the app
@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
