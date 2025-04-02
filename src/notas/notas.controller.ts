import { Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as xml2js from 'xml2js';
import { NotasService } from './notas.service';
import { v4 as uuidv4 } from 'uuid';
import { Notas } from 'src/db/entities/notas.entity';

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
        return this.notasService.create({ id, xml: xmlString });
    }

    @Get('cpf/:cpf')
    async findByCpf(@Param('cpf') cpf: string): Promise<Notas[]> {
        return await this.notasService.findByCpf(cpf);
    }
}