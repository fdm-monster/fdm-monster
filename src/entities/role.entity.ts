import { Column, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from "typeorm";
import { UserRole } from "@/entities/user-role.entity";

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  name: string;

  @OneToMany(
    () => UserRole,
    (ur) => ur.role,
    { eager: false },
  )
  roles: Relation<UserRole>[];
}
