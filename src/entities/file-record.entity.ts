import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type FileRecordType = "dir" | "gcode" | "bgcode" | "3mf";

@Entity()
export class LocalFileRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: true })
  parentId: number | null;

  @Column({ type: "varchar", nullable: false })
  type: FileRecordType;

  @Column({ type: "varchar", nullable: false })
  name: string;

  @Column({ type: "varchar", nullable: false, unique: true })
  @Index()
  fileGuid: string;

  @Column({ type: "text", nullable: true })
  metadata: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
