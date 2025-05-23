import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('queue')
export class Queue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  orderIndex: number;

  @Column({ type: 'varchar', unique: true })
  filePath: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ type: 'text', nullable: true })
  thumbnailBase64?: string;

  @Column({ type: 'int', default: 0 })
  printedCount: number;

  @CreateDateColumn()
  uploadDate: Date;

  @Column({ type: 'int', default: 1 })
  totalPrintsRequired: number;
} 