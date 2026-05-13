import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { User } from "@/entities/user.entity";
import { Role } from "@/entities/role.entity";

/**
 * Long-lived bearer credential for programmatic API access.
 *
 * Token format: `fdmm_pat_<base64url>` (high-entropy CSPRNG). The `prefix`
 * is the indexable lookup column; `hashedSecret` is sha256 of the full
 * token, verified with timingSafeEqual.
 *
 * Permissions are derived from `roles` (via the `api_key_role` join table),
 * NOT from the bound user's roles. `createdByUserId` is audit-only — it
 * records who minted the key and does not drive authorisation.
 */
@Entity()
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "createdByUserId" })
  createdByUser: Relation<User>;

  @Column()
  createdByUserId: number;

  @Column()
  label: string;

  @Index()
  @Column({ unique: true })
  prefix: string;

  @Column()
  hashedSecret: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: "datetime", nullable: true })
  lastUsedAt: Date | null;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: "api_key_role",
    joinColumn: { name: "apiKeyId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "roleId", referencedColumnName: "id" },
  })
  roles: Relation<Role>[];
}
