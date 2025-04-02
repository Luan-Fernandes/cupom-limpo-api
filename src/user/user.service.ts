import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/db/entities/user.entity';
import { Repository } from 'typeorm';
import { CompleteRegisterDto, PreRegisterCpfDto, UserDto } from './user.dto';
import { hashSync as bcryptHashSync } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly mailerService: MailerService,
    ) {}

    //completa o cadastro
    async completeRegister(cpf: string, completeRegisterDto: CompleteRegisterDto): Promise<any> {
        const user = await this.userRepository.findOne({ where: { cpf } });

        if (!user) {
            throw new NotFoundException('Usuário não encontrado.');
        }

        user.username = completeRegisterDto.nome;
        user.email = completeRegisterDto.email;
        user.passwordHash = bcryptHashSync(completeRegisterDto.password, 6);
        user.verificationToken = uuidv4(); 

        await this.userRepository.save(user);

        await this.sendVerificationEmail(user);

        return { message: 'Cadastro completo com sucesso. Verifique seu email para confirmação.' };
    }

    //criar user com verificação no email.
    async register(newUser: UserDto) {
        const userAlreadyExists = await this.userRepository.findOne({
            where: { email: newUser.email, cpf: newUser.cpf },
        });

        if (userAlreadyExists) {
            throw new HttpException('User already exists', HttpStatus.CONFLICT);
        }

        const dbUser = new User();
        dbUser.email = newUser.email;
        dbUser.username = newUser.username;
        dbUser.passwordHash = bcryptHashSync(newUser.password, 6);
        dbUser.cpf = newUser.cpf;
        dbUser.verificationToken = uuidv4();

        await this.userRepository.save(dbUser);

        await this.sendVerificationEmail(dbUser);

        return { message: 'User registered. Please check your email for verification.' };
    }

    //pre-register com cpf.
    async preRegisterCpf(preRegisterCpfDto: PreRegisterCpfDto) {
        const userAlreadyExists = await this.userRepository.findOne({ where: { cpf: preRegisterCpfDto.cpf } });

        if (userAlreadyExists) {
            throw new HttpException('CPF already registered', HttpStatus.CONFLICT);
        }

        const newUser = new User();
        newUser.cpf = preRegisterCpfDto.cpf;

        await this.userRepository.save(newUser);

        return { message: 'Pre-registration with CPF successful.' };
    }

    // Enviar email de verificação.
    async sendVerificationEmail(user: User) {
        const verificationLink = `google.com?token=${user.verificationToken}`; //redireciona user para tela de verificação.

        try {
            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Verifique seu email',
                html: `
                    <p>Olá,</p>
                    <p>Por favor, clique no link abaixo para verificar seu email:</p>
                    <a href="${verificationLink}">Verificar Email</a>
                `,
            });
            console.log(`Email de verificação enviado para ${user.email}`);

        } catch (error) {
            return new HttpException('Failed to send verification email', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    //buscar user pelo cpf.
    async findByCpf(cpf: string): Promise<UserDto | null> {
        const userFound = await this.userRepository.findOne({
            where: { cpf },
            relations: ['notas'],
        });

        if (!userFound) {
            return null;
        }
        return {
            id: userFound.id,
            username: userFound.username,
            email: userFound.email,
            cpf: userFound.cpf,
            password: userFound.passwordHash,
            notas: userFound.notas,
            isVerified: userFound.isVerified
        };
    }

    //criando token de redefinição de senha
    async generateResetToken(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        user.resetToken = uuidv4();
        user.resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora de expiração
        await this.userRepository.save(user);
        return user.resetToken;
    }

    //Enviar email de redefinição de senha
    async sendResetPasswordEmail(email: string, token: string) {
        const resetLink = `http://localhost:3009/user/reset-password/${token}`;
        await this.mailerService.sendMail({
            to: email,
            subject: 'Redefinição de senha',
            html: `<p>Clique <a href="${resetLink}">aqui</a> para redefinir sua senha.</p>`,
        });
    }

    //Validar token
    async validateResetToken(token: string) {
        const user = await this.userRepository.findOne({ where: { resetToken: token } });

        if (!user || user.resetTokenExpiry === null || user.resetTokenExpiry < new Date()) {
            throw new HttpException('Invalid or expired token', HttpStatus.BAD_REQUEST);
        }

        return user;
    }

    //Redefinir senha
    async resetPassword(token: string, newPassword: string) {
        const user = await this.validateResetToken(token);
        user.passwordHash = bcryptHashSync(newPassword, 6);
        user.resetToken = '';
        user.resetTokenExpiry = null;
        await this.userRepository.save(user);
    }

    async verifyUser(token: string) {
        const user = await this.userRepository.findOne({ where: { verificationToken: token } });

        if (!user) {
            throw new HttpException('Invalid verification token', HttpStatus.BAD_REQUEST);
        }

        user.isVerified = true;
        user.verificationToken = '';

        await this.userRepository.save(user);

        return { message: 'Email verified successfully.' };
    }

}