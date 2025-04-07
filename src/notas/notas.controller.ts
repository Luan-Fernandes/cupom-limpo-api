import { Controller, Get, HttpException, HttpStatus, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as xml2js from 'xml2js';
import { NotasService } from './notas.service';
import { v4 as uuidv4 } from 'uuid';
import { Notas } from 'src/db/entities/notas.entity';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notas')
export class NotasController {
    constructor(private readonly notasService: NotasService) {}

    // Cria uma nova nota e pre-cadastra o CPF do destinatário se ele não estiver cadastrado.
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadXml(@UploadedFile() file: Express.Multer.File) {

        const parser = new xml2js.Parser({ explicitArray: false });
        const xml = file.buffer.toString('utf-8');

        const jsonData = await new Promise((resolve, reject) => {
            parser.parseString(xml, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        const xmlString = JSON.stringify(jsonData);
        const id = uuidv4();
        return this.notasService.create({ id, xml: xmlString });
    }

    // Busca as notas do usuário autenticado
    @UseGuards(AuthGuard)
    @Get()
    async findMyNotes(@Req() request: Request): Promise<Notas[]> {
      const userId = request['user'].sub;
      const isVerified = request['user'].isVerified;
    
      if (!isVerified) {
        throw new HttpException('User not verified', HttpStatus.BAD_REQUEST);
      }
    
      return await this.notasService.findByUserId(userId);
    }
}