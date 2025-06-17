import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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

  // Faz o upload do XML
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadXml(@UploadedFile() file: Express.Multer.File) {
    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const xml = file.buffer.toString('utf-8');

      const jsonData = await parser.parseStringPromise(xml);
      const xmlString = JSON.stringify(jsonData);
      const id = uuidv4();

      const savedNota = await this.notasService.create({ id, xml: xmlString });

      const uploadDir = path.join(process.cwd(), 'uploads', 'xmls');
      const fileName = `${savedNota.id}.xml`;
      const filePath = path.join(uploadDir, fileName);

      fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(filePath, xml);

      return savedNota;
    } catch (error) {
      console.error('Erro ao processar o XML:', error);
      throw new Error('Erro ao fazer upload do XML.');
    }
  }

  // Encontra as notas do usuário
  @UseGuards(AuthGuard)
  @Get()
  async findMyNotes(
    @Req() request: Request,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const userId = request['user'].sub;
    const isVerified = request['user'].isVerified;

    if (!isVerified) {
      throw new HttpException('User not verified', HttpStatus.BAD_REQUEST);
    }

    const {
      data,
      total,
      page: currentPage,
      lastPage,
    } = await this.notasService.findNotasByUserId(
      userId,
      Number(page),
      Number(limit),
    );

    const enrichedData = await this.notasService.enrichNotasWithXML(data);

    return {
      data: enrichedData,
      total,
      page: currentPage,
      lastPage,
    };
  }

  // Encontra as notas agrupadas por Nome Fantasia
  @Get('agrupadas')
  @UseGuards(AuthGuard)
  async getNotasAgrupadas(
    @Req() request: Request,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userId = request['user'].sub;
    const isVerified = request['user'].isVerified;
  
    if (!isVerified) {
      throw new HttpException('User not verified', HttpStatus.BAD_REQUEST);
    }
  
    return this.notasService.findNotasAgrupadasPorFantasia(userId, page, limit);
  }
  
}
