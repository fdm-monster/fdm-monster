import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { RefreshToken } from "@/entities/refresh-token.entity";
import { BaseEntity } from "@/entities/base.entity";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  username!: string;

  @Column({
    default: false,
  })
  isDemoUser!: boolean;

  @Column({
    default: false,
  })
  isRootUser!: boolean;

  @Column({
    default: false,
  })
  isVerified!: boolean;

  @Column({
    default: true,
  })
  needsPasswordChange!: boolean;

  @Column()
  passwordHash!: string;

  @Column()
  createdAt!: Date;

  // TODO should be foreign key
  @Column({ type: "simple-array" })
  roles!: number[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshToken[];
}
