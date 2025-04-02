// user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Notas } from "./notas.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50,nullable: true })
    username: string;

    @Column({ unique: true, nullable: true })
    email: string;

    @Column({ length: 100, nullable: true })
    passwordHash: string;

    @Column({ length: 11, unique: true })
    cpf: string;

    @Column({ nullable: true })
    verificationToken: string;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ nullable: true })
    resetToken: string;

    @Column({ type: 'timestamp', nullable: true })
    resetTokenExpiry: Date | null;

    @OneToMany(() => Notas, (notas) => notas.user)
    notas: Notas[];
}