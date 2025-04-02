import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotasModule } from './notas/notas.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [NotasModule, UserModule, AuthModule,DbModule,ConfigModule.forRoot({isGlobal: true}), MailModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
