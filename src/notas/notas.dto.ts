import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class NotasDto {
    @IsUUID()
    id: string;
  
    @IsString()
    @IsNotEmpty()
    xml: string;
  
    @IsOptional()
    dateEmissao?: Date;
  
    @IsOptional()
    value?: number;
  
    @IsOptional()
    chaveDeAcesso?: string;
  
    @IsOptional()
    noteNumber?: string;
  
    @IsOptional()
    corporateReason?: string;
  }
  