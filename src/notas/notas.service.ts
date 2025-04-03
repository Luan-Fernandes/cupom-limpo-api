import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Notas } from 'src/db/entities/notas.entity';
import { User } from 'src/db/entities/user.entity';
import { NotasDto } from './notas.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class NotasService {
    constructor(
        @InjectRepository(Notas)
        private readonly notasRepository: Repository<Notas>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly userService: UserService
    ) {}

    // Cria uma nova nota e pre-cadastra o CPF do destinatário se ele não estiver cadastrado.
    async create(notasDto: NotasDto): Promise<Notas> {
        const extractCPF = (data: any): string | null => {
            if (typeof data.xml === 'string') {
                try {
                    const xmlObject = JSON.parse(data.xml);
                    return xmlObject?.nfeProc?.NFe?.infNFe?.dest?.CPF ||
                           xmlObject?.NFe?.infNFe?.dest?.CPF || null;
                } catch (error) {
                    console.error('Erro ao analisar JSON do XML:', error);
                    return null;
                }
            }
            return null;
        };

        const cpf = extractCPF(notasDto);

        if (!cpf) {
            throw new Error('CPF não encontrado no JSON do XML da nota.');
        }

        let user = await this.userRepository.findOne({ where: { cpf: cpf } });

        if (!user) {
            try {
                await this.userService.preRegisterCpf({ cpf: cpf });
                user = await this.userRepository.findOne({ where: { cpf: cpf } });
                if(!user){
                    throw new Error("Usuario não cadastrado após o pré cadastro.")
                }
            } catch (error) {
                console.error("Erro ao pré cadastrar ou encontrar o usuário:", error);
                throw error;
            }
        }

        const nota = this.notasRepository.create({
            xml: notasDto.xml,
            cpf: cpf,
            user: user,
        });

        return await this.notasRepository.save(nota);
    }

    // Busca as notas pelo CPF do destinatário.
    async findByCpf(cpf: string): Promise<Notas[]> {
        return await this.notasRepository.find({ where: { cpf: cpf } });
    }
}