import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Relation, Unique } from "typeorm";
import { Role } from "@/entities/role.entity";
import { User } from "@/entities/user.entity";
import { BaseEntity } from "@/entities/base.entity";

@Entity()
@Unique(["roleId", "userId"])
export class UserRole extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Role, {
    onDelete: "CASCADE",
    nullable: false,
  })
  role!: Relation<Role>;
  @Column()
  roleId!: number;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
    nullable: false,
  })
  user!: Relation<User>;
  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
