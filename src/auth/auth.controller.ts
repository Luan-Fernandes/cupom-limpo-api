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

    @HttpCode(HttpStatus.OK)
    @Post('check-cpf')
    async checkCpf(@Body('cpf') cpf: string): Promise<AuthResponseDto> {
        return this.authService.checkCpf(cpf);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(
        @Body('cpf') cpf: string,
        @Body('password') password: string,
    ): Promise<AuthResponseDto> {
        return this.authService.signIn(cpf, password);
    }

    @HttpCode(HttpStatus.OK)
    @Put('complete-register')
    async completeRegister(
        @Body() completeRegisterDto: CompleteRegisterDto,
    ): Promise<AuthResponseDto> {
        return this.authService.completeRegister(completeRegisterDto);
    }

    @Get('verify')
    async verifyEmail(@Query('token') token: string) {
        try {
            const result = await this.userService.verifyUser(token);
            return result;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}