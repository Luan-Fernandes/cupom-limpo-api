import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { PreRegisterCpfDto, UserDto } from './user.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
    
    @Post('register')
    async register(@Body() user: UserDto) {
        return await this.userService.register(user);
    }

    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        const token = await this.userService.generateResetToken(email);
        await this.userService.sendResetPasswordEmail(email, token);
        return { message: 'Reset link sent to your email.' };
    }

    @Get('reset-password/:token')
    async validateToken(@Param('token') token: string) {
        await this.userService.validateResetToken(token);
        return { message: 'Token valid.'};
    }

    @Put('reset-password/:token')
    async resetPassword(@Param('token') token: string, @Body('newPassword') newPassword: string) {
        await this.userService.resetPassword(token, newPassword);
        return { message: 'Password reset successfully.' };
    }

    @Post('pre-register-cpf')
    async preRegisterCpf(@Body() cpf: PreRegisterCpfDto) {
        return await this.userService.preRegisterCpf(cpf);
    }
}