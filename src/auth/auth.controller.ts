import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Put, Query } from '@nestjs/common';
import { AuthResponseDto } from './auth.dto';
import { AuthService } from './auth.service';
import { CompleteRegisterDto } from 'src/user/user.dto';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService
    ) {}

    // Verifica se o CPF foi cadastrado ou pre-cadastrado.
    @HttpCode(HttpStatus.OK)
    @Post('check-cpf')
    async checkCpf(@Body('cpf') cpf: string): Promise<AuthResponseDto> {
        return this.authService.checkCpf(cpf);
    }

    // Autentica o usuário.
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(
        @Body('cpf') cpf: string,
        @Body('password') password: string,
    ): Promise<AuthResponseDto> {
        return this.authService.signIn(cpf, password);
    }

    // Completa o cadastro e verifica o email.
    @HttpCode(HttpStatus.OK)
    @Put('complete-register')
    async completeRegister(
        @Body() completeRegisterDto: CompleteRegisterDto,
    ): Promise<AuthResponseDto> {
        return this.authService.completeRegister(completeRegisterDto);
    }

    // Verifica o email do user.
    @Get('verify')
    async verifyEmail(@Query('token') token: string) {
        try {
            const result = await this.userService.verifyUser(token);
            return result;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'verificação falhou', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}