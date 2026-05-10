import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { User } from "@/entities/user.entity";

/**
 * Long-lived bearer credential for programmatic API access.
 *
 * The cleartext token is shown to the user once at creation time and never
 * stored. We persist:
 *   - a fixed `prefix` (token's leading characters) for O(1) lookup, and
 *   - `hashedSecret` (sha256 of the full token) for verification.
 *
 * Tokens inherit the role/permissions of the bound user. Revoking a key
 * sets `revokedAt`; revoked rows are kept for audit and never re-issue.
 */
@Entity()
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: Relation<User>;

  @Column()
  userId: number;

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

  @Column({ type: "datetime", nullable: true })
  revokedAt: Date | null;
}
