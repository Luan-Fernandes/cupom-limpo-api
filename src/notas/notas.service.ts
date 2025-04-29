import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notas } from 'src/db/entities/notas.entity';
import { User } from 'src/db/entities/user.entity';
import { NotasDto } from './notas.dto';
import { UserService } from 'src/user/user.service';
import * as fs from 'fs/promises';
import { join } from 'path';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class NotasService {
  constructor(
    @InjectRepository(Notas)
    private readonly notasRepository: Repository<Notas>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly userService: UserService,
  ) {}

  // Extrai o CPF do XML
  private extractCPF(data: any): string | null {
    if (typeof data.xml === 'string') {
      try {
        const xmlObject = JSON.parse(data.xml);
        return (
          xmlObject?.nfeProc?.NFe?.infNFe?.dest?.CPF ||
          xmlObject?.NFe?.infNFe?.dest?.CPF ||
          null
        );
      } catch (error) {
        console.error('Erro ao analisar JSON do XML para extrair CPF:', error);
        return null;
      }
    }
    return null;
  }

  // Extrai a chave de acesso do XML
  private extractChaveDeAcesso(data: any): string | null {
    if (typeof data.xml === 'string') {
      try {
        const xmlObject = JSON.parse(data.xml);
        const id =
          xmlObject?.nfeProc?.NFe?.infNFe?.['$']?.Id ||
          xmlObject?.NFe?.infNFe?.['$']?.Id ||
          null;

        return id ? id.replace(/^NFe/, '') : null;
      } catch (error) {
        console.error('Erro ao extrair chave de acesso do XML:', error);
        return null;
      }
    }
    return null;
  }

  // Cria uma nova nota e pre-cadastra o CPF do destinatário se ele não estiver cadastrado.
  async create(notasDto: NotasDto): Promise<Notas> {
    const cpf = this.extractCPF(notasDto);

    if (!cpf) {
      throw new HttpException(
        'CPF não encontrado no JSON do XML da nota.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let user = await this.userRepository.findOne({ where: { cpf } });

    if (!user) {
      try {
        await this.userService.preRegisterCpf({ cpf });
        user = await this.userRepository.findOne({ where: { cpf } });
        if (!user) {
          throw new Error('Usuário não cadastrado após o pré-cadastro.');
        }
      } catch (error) {
        console.error('Erro ao pré-cadastrar ou encontrar o usuário:', error);
        throw error;
      }
    }

    const chaveDeAcesso = this.extractChaveDeAcesso(notasDto);

    if (!chaveDeAcesso) {
      throw new HttpException(
        'Chave de acesso não encontrada no JSON do XML da nota.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingNota = await this.notasRepository.findOne({
      where: { xml: chaveDeAcesso },
    });

    if (existingNota) {
      throw new HttpException('Nota ja cadastrada', HttpStatus.BAD_REQUEST);
    }

    const nota = this.notasRepository.create({
      xml: chaveDeAcesso ? chaveDeAcesso : '',
      userId: user.id,
      user: user,
    });

    return await this.notasRepository.save(nota);
  }

  // Busca as notas do user.
  async findByUserId(userId: string): Promise<any[]> {
    const notas = await this.notasRepository.find({ where: { userId } });

    const results = await Promise.all(
      notas.map(async (nota) => {
        try {
          const filePath = join(
            __dirname,
            '..',
            '..',
            'uploads',
            'xmls',
            `${nota.id}.xml`,
          );
          const xmlContent = await fs.readFile(filePath, 'utf-8');

          return {
            id: nota.id,
            xml: xmlContent,
          };
        } catch (err) {
          console.error(`Erro ao ler o arquivo XML da nota ${nota.id}:`, err);
          return {
            id: nota.id,
            error: 'Erro ao ler o arquivo XML',
          };
        }
      }),
    );

    return results;
  }
}
