import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IsNotEmpty, MinLength } from "class-validator";
import { UserConstants } from "../user.constants";
import { AuditedEntity } from "@/shared/entities/audited.entity";
import { AutoMap } from "@automapper/classes";

@Entity()
export class User extends AuditedEntity {
  @PrimaryGeneratedColumn()
  @AutoMap()
  id: number;

  @Column({ unique: true })
  @IsNotEmpty()
  @MinLength(UserConstants.minUsernameLength)
  @AutoMap()
  username: string;

  @IsNotEmpty()
  @Column()
  passwordHash: string;
}
