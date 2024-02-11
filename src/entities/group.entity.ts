import { Column, Entity } from "typeorm";
import { BaseEntity } from "@/entities/base.entity";
import { Length } from "class-validator";

@Entity()
export class Group extends BaseEntity {
  @Column()
  @Length(1)
  name: string;
}
