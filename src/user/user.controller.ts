import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { PreRegisterCpfDto, UserDto } from './user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  //criar user com verificação no email.
  @Post('register')
  async register(@Body() user: UserDto) {
    return await this.userService.register(user);
  }

  //caso precise reenviar o email de verificação.
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return await this.userService.resendVerificationEmail(email);
  }

  //enviar email de redefinição de senha.
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    const token = await this.userService.generateResetToken(email);
    await this.userService.sendResetPasswordEmail(email, token);
    return { message: 'Reset link sent to your email.' };
  }

  //validar token de redefinição de senha.
  @Get('reset-password/:token')
  async validateToken(@Param('token') token: string) {
    await this.userService.validateResetToken(token);
    return { message: 'Token valid.' };
  }

  //redefinir senha do user.
  @Put('reset-password/:token')
  async resetPassword(
    @Param('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.userService.resetPassword(token, newPassword);
    return { message: 'Password reset successfully.' };
  }

  //pre-register com cpf.
  @Post('pre-register-cpf')
  async preRegisterCpf(@Body() cpf: PreRegisterCpfDto) {
    return await this.userService.preRegisterCpf(cpf);
  }
}
