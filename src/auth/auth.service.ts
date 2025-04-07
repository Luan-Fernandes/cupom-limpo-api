import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from './auth.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { CompleteRegisterDto } from 'src/user/user.dto';

@Injectable()
export class AuthService {

  private jwtExpirationTimeInSeconds: number;

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.jwtExpirationTimeInSeconds = this.configService.get<number>('JWT_EXPIRATION_TIME') ?? 3600;
  }

  // Verifica se o CPF foi cadastrado ou pre-cadastrado.
  async checkCpf(cpf: string): Promise<AuthResponseDto> {
    const foundUser = await this.usersService.findByCpf(cpf);

    if (!foundUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const isComplete = !!foundUser.password;

    return {
      message: isComplete ? 'Cadastro completo. Insira a senha.' : 'Cadastro incompleto. Complete seu cadastro.',
      completeCadastro: !isComplete,
    };
  }

  // Autentica o usuário.
  async signIn(cpf: string, password: string): Promise<AuthResponseDto> {
    const foundUser = await this.usersService.findByCpf(cpf);

    if (!foundUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!bcrypt.compareSync(password, foundUser.password)) {
      throw new UnauthorizedException();
    }

    const payload = {
      sub: foundUser.id,
      email: foundUser.email,
      cpf: foundUser.cpf,
      userName: foundUser.username,
      isVerified: foundUser.isVerified
    };

    const token = this.jwtService.sign(payload, { expiresIn: Number(this.jwtExpirationTimeInSeconds) });

    return { token, expiresIn: Number(this.jwtExpirationTimeInSeconds) };
  }

  // consome o service de completar o cadastro para ser autenticado.
  async completeRegister(completeRegisterDto: CompleteRegisterDto): Promise<AuthResponseDto> {
    const result = await this.usersService.completeRegister(completeRegisterDto.cpf, completeRegisterDto);
    return { message: result.message, completeCadastro: false };
  }
}