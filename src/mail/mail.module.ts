// mail.module.ts
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Usando STARTTLS
        auth: {
          user: 'luandevfernandes@gmail.com',
          pass: 'ijxduaulnyvspyiz', // Substitua pela senha de aplicativo
        },
      },
      defaults: {
        from: 'luandevfernandes@gmail.com',
      },
      template: {
        dir: join(__dirname, 'verification'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  exports: [MailerModule],
})
export class MailModule {}