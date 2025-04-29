import { Controller, Get, HttpException, HttpStatus, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as xml2js from 'xml2js';
import { NotasService } from './notas.service';
import { v4 as uuidv4 } from 'uuid';
import { Notas } from 'src/db/entities/notas.entity';
import { AuthGuard } from '../auth/auth.guard';
import * as fs from 'fs';
import * as path from 'path';

@Controller('notas')
export class NotasController {
    constructor(private readonly notasService: NotasService) {}

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

          const savedNota = await this.notasService.create({ id, xml: xmlString });

          // Usar o ID da nota salva para nomear o arquivo
          const fileName = `${savedNota.id}.xml`;
          const uploadPath = path.join(process.cwd(), 'uploads', 'xmls');

          if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
          }

          const filePath = path.join(uploadPath, fileName);

          // Escrever o arquivo XML original
          fs.writeFileSync(filePath, xml);

          return savedNota;
  }

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