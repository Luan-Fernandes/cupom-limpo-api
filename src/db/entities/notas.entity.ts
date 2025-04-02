import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('notas')
export class Notas {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    xml: string;

    @Column({ type: 'varchar', length: 11 })
    cpf?: string;

    @ManyToOne(() => User, (user) => user.notas, { onDelete: 'CASCADE' }) 
    @JoinColumn({ name: 'cpf', referencedColumnName: 'cpf' })
    user?: User;
}
