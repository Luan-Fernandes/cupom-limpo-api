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
      try {
        const parser = new xml2js.Parser({ explicitArray: false });
        const xml = file.buffer.toString('utf-8');
    
        // Converte XML para JSON usando Promise nativa do xml2js
        const jsonData = await parser.parseStringPromise(xml);
        const xmlString = JSON.stringify(jsonData);
        const id = uuidv4();
    
        // Salva a nota no banco
        const savedNota = await this.notasService.create({ id, xml: xmlString });
    
        // Caminho onde o arquivo XML será salvo
        const uploadDir = path.join(process.cwd(), 'uploads', 'xmls');
        const fileName = `${savedNota.id}.xml`;
        const filePath = path.join(uploadDir, fileName);
    
        // Cria o diretório se ele não existir
        fs.mkdirSync(uploadDir, { recursive: true });
    
        // Escreve o arquivo XML original no disco
        fs.writeFileSync(filePath, xml);
    
        return savedNota;
      } catch (error) {
        console.error('Erro ao processar o XML:', error);
        throw new Error('Erro ao fazer upload do XML.');
      }
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