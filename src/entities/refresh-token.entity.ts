import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm";
import { User } from "@/entities/user.entity";

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => User,
    (user) => user.refreshTokens,
    { nullable: false, onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "userId" })
  user: Relation<User>;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: number;

  @Column()
  refreshToken: string;

  @Column()
  refreshAttemptsUsed: number;
}
