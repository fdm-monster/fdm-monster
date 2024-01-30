import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { BaseEntity } from "@/entities/base.entity";
import { UserRole } from "@/entities/user-role.entity";

@Entity()
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @OneToMany(() => UserRole, (ur) => ur.role, { eager: false })
  roles: Relation<UserRole>[];
}
