import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Role } from "../user.constants";
import { IsEnum } from "class-validator";
import { User } from "@/users/entities/user.entity";
import { AutoMap } from "@automapper/classes";
import { AuditedEntity } from "@/shared/entities/audited.entity";

@Entity({
  name: "user_roles",
})
@Unique(["role", "userId"])
export class UserRole extends AuditedEntity {
  @PrimaryGeneratedColumn()
  @AutoMap()
  id: number;

  @Column({
    type: "enum",
    enum: Role,
    default: Role.User,
  })
  @IsEnum(Role)
  @AutoMap()
  role: Role;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
  @Column()
  @AutoMap()
  userId: number;
}
