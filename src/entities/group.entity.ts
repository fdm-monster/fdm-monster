import { Column, Entity } from "typeorm";
import { BaseEntity } from "@/entities/base.entity";

@Entity()
export class Group extends BaseEntity {
  @Column()
  name: string;
}
