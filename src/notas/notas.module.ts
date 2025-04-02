import { Module } from '@nestjs/common';
import { NotasController } from './notas.controller';
import { NotasService } from './notas.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notas } from 'src/db/entities/notas.entity';
import { User } from 'src/db/entities/user.entity';
import { MailModule } from 'src/mail/mail.module'; 
import { MulterModule } from '@nestjs/platform-express';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule,TypeOrmModule.forFeature([Notas, User]), MulterModule.register(),
      MailModule,],
  controllers: [NotasController],
  providers: [NotasService],
  exports: [NotasService],
})
export class NotasModule {}
