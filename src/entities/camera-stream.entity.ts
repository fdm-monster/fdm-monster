import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Printer } from "@/entities/printer.entity";
import { BaseEntity } from "@/entities/base.entity";

@Entity()
export class CameraStream extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  streamURL!: string;

  @Column()
  name!: string;

  @OneToOne(() => Printer, { nullable: true })
  @JoinColumn({ name: "printerId" })
  printer?: Relation<Printer>;
  @Column({ nullable: true, unique: true })
  printerId?: number;

  @Column({ nullable: false, default: "16:9" })
  aspectRatio!: string;

  @Column({ nullable: false, default: 0 })
  rotationClockwise!: number;

  @Column({ nullable: false, default: false })
  flipHorizontal!: boolean;

  @Column({ nullable: false, default: false })
  flipVertical!: boolean;
}
