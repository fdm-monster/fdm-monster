import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { RefreshToken } from "@/entities/refresh-token.entity";
import { UserRole } from "@/entities/user-role.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({
    default: false,
  })
  isDemoUser: boolean;

  @Column({
    default: false,
  })
  isRootUser: boolean;

  @Column({
    default: false,
  })
  isVerified: boolean;

  @Column({
    default: true,
  })
  needsPasswordChange: boolean;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(
    () => UserRole,
    (ur) => ur.user,
    { eager: true },
  )
  roles?: Relation<UserRole>[];

  @OneToMany(
    () => RefreshToken,
    (refreshToken) => refreshToken.user,
  )
  refreshTokens: RefreshToken[];
}
