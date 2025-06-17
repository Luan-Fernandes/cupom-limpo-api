import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/db/entities/user.entity';
import { Repository } from 'typeorm';
import { CompleteRegisterDto, PreRegisterCpfDto, UserDto } from './user.dto';
import { hashSync as bcryptHashSync } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config'; // importado para pegar a URL do frontend via .env

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService, // injetado via construtor
  ) {}

  //completa o cadastro e verifica o email.
  async completeRegister(
    cpf: string,
    completeRegisterDto: CompleteRegisterDto,
  ): Promise<any> {
    const user = await this.userRepository.findOne({ where: { cpf } });

    const emailAlreadyExists = await this.userRepository.findOne({
      where: { email: completeRegisterDto.email },
    });

    if (emailAlreadyExists) {
      throw new HttpException('Email ja cadastrado', HttpStatus.CONFLICT);
    }

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    user.username = completeRegisterDto.username;
    user.email = completeRegisterDto.email;
    user.passwordHash = bcryptHashSync(completeRegisterDto.password, 6);
    user.verificationToken = uuidv4();

    await this.userRepository.save(user);

    await this.sendVerificationEmail(user);

    return {
      message:
        'Cadastro completo com sucesso. Verifique seu email para confirmação.',
    };
  }

  //criar user com verificação no email.
  async register(newUser: UserDto) {
    if (
      !newUser.cpf ||
      !newUser.email ||
      !newUser.password ||
      !newUser.username
    ) {
      throw new HttpException(
        'Campos obrigatórios não preenchidos',
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log('Dados recebidos para cadastro:', newUser);

    const existingUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email ILIKE :email OR user.cpf ILIKE :cpf', {
        email: newUser.email,
        cpf: newUser.cpf,
      })
      .getOne();

    console.log('existingUser:', existingUser);

    if (existingUser) {
      if (
        existingUser.email.toLowerCase() === newUser.email.toLowerCase() &&
        existingUser.cpf.toLowerCase() === newUser.cpf.toLowerCase()
      ) {
        throw new HttpException(
          'Email e CPF já cadastrados',
          HttpStatus.CONFLICT,
        );
      }
      if (existingUser.email.toLowerCase() === newUser.email.toLowerCase()) {
        throw new HttpException('Email já cadastrado', HttpStatus.CONFLICT);
      }
      if (existingUser.cpf.toLowerCase() === newUser.cpf.toLowerCase()) {
        throw new HttpException('CPF já cadastrado', HttpStatus.CONFLICT);
      }
    }

    const dbUser = new User();
    dbUser.email = newUser.email;
    dbUser.username = newUser.username;
    dbUser.passwordHash = bcryptHashSync(newUser.password, 6);
    dbUser.cpf = newUser.cpf;
    dbUser.verificationToken = uuidv4();

    await this.userRepository.save(dbUser);

    await this.sendVerificationEmail(dbUser);

    return {
      message: 'User registered. Please check your email for verification.',
    };
  }

  // Reenviar token de verificação de email
  async resendVerificationEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.isVerified) {
      throw new HttpException('Usuário já verificado.', HttpStatus.BAD_REQUEST);
    }

    user.verificationToken = uuidv4();
    await this.userRepository.save(user);

    await this.sendVerificationEmail(user);

    return { message: 'Email de verificação reenviado com sucesso.' };
  }

  //pre-register com cpf.
  async preRegisterCpf(preRegisterCpfDto: PreRegisterCpfDto) {
    const userAlreadyExists = await this.userRepository.findOne({
      where: { cpf: preRegisterCpfDto.cpf },
    });

    if (userAlreadyExists) {
      throw new HttpException('CPF ja cadastrado', HttpStatus.CONFLICT);
    }

    const newUser = new User();
    newUser.cpf = preRegisterCpfDto.cpf;

    await this.userRepository.save(newUser);

    return { message: 'Usuario criado com sucesso.' };
  }

  // Enviar email de verificação do user
  async sendVerificationEmail(user: User) {
    const frontendUrl = this.configService.get<string>(
      'VERIFICATION_EMAIL_URL',
    );
    const verificationLink = `${frontendUrl}/auth/verify?token=${user.verificationToken}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Verifique seu email',
        template: 'verificationEmail',
        context: {
          name: user.username || 'usuário',
          verificationLink,
          year: new Date().getFullYear(),
        },
      });

      console.log(`Email de verificação enviado para ${user.email}`);

      return {
        success: true,
        message: 'Email de verificação enviado com sucesso',
      };
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      throw new HttpException(
        'Falha ao enviar email de verificação',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //verificar email do user.
  async verifyUser(token: string) {
    if (!token) {
      throw new HttpException(
        'Verificação do token falhou',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new HttpException(
        'Invalid verification token',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.isVerified = true;
    user.verificationToken = '';

    await this.userRepository.save(user);

    return { message: 'Email verified successfully.' };
  }

  //buscar user pelo cpf ,  retorna dados do mesmo.
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
      isVerified: userFound.isVerified,
    };
  }

  //criando token de redefinição de senha.
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

  //Enviar email de redefinição de senha.
  async sendResetPasswordEmail(email: string, token: string) {
    const frontendUrl = this.configService.get<string>('RESET_PASSWORD_URL');
    const resetLink = `${frontendUrl}/reset-senha/${token}`;
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Redefinição de senha',
        template: 'resetPassword',
        context: {
          resetLink,
          year: new Date().getFullYear(),
        },
      });

      console.log(`Email de redefinição de senha enviado para ${email}`);
    } catch (error) {
      console.error('Erro ao enviar email de redefinição de senha:', error);
      throw new HttpException(
        'Falha ao enviar email de redefinição de senha',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Validar token de redefinição de senha.
  async validateResetToken(token: string) {
    const user = await this.userRepository.findOne({
      where: { resetToken: token },
    });

    if (
      !user ||
      user.resetTokenExpiry === null ||
      user.resetTokenExpiry < new Date()
    ) {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.BAD_REQUEST,
      );
    }

    return user;
  }

  //Redefinir senha do user.
  async resetPassword(token: string, newPassword: string) {
    const user = await this.validateResetToken(token);
    user.passwordHash = bcryptHashSync(newPassword, 6);
    user.resetToken = '';
    user.resetTokenExpiry = null;
    await this.userRepository.save(user);
  }
}
