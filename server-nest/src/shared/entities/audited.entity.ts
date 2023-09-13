import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from "typeorm";
import { AutoMap } from "@automapper/classes";

export class CreatedEntity {
  @CreateDateColumn()
  @AutoMap()
  createdAt: Date;
  @Column({ nullable: true })
  @AutoMap()
  createdBy: number;
}

export class DeletedEntity {
  @Column({ nullable: true })
  @AutoMap()
  deletedBy: number | null;
  @DeleteDateColumn({ nullable: true })
  @AutoMap()
  deletedAt: Date | null;
}

export class AuditedEntity {
  @CreateDateColumn()
  @AutoMap()
  createdAt: Date;
  @Column({ nullable: true })
  @AutoMap()
  createdBy: number | null;
  @UpdateDateColumn()
  @AutoMap()
  updatedAt: Date;
  @Column({ nullable: true })
  @AutoMap()
  updatedBy: number | null;
  @Column({ nullable: true })
  @AutoMap()
  deletedBy: number | null;
  @DeleteDateColumn({ nullable: true })
  @AutoMap()
  deletedAt: Date | null;
}
