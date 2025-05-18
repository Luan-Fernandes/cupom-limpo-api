import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('notas')
export class Notas {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  xml: string;

  @Column({ type: 'date' , nullable: true })
  dateEmissao: Date;

  @Column({ type: 'float', nullable: true })
  value: number;

  @Column({type: 'varchar', nullable: true })
  noteNumber: string;

  @Column({ type: 'varchar', nullable: true })
  corporateReason: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.notas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cpf', referencedColumnName: 'cpf' })
  user?: User;
}