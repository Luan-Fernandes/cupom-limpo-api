// user.dto.ts
import { Type } from "class-transformer";
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from "class-validator";
import { NotasDto } from "src/notas/notas.dto";


export class PreRegisterCpfDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(11)
    @MaxLength(11)
    cpf: string;
  }

  export class CompleteRegisterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(11)
    @MaxLength(11)
    cpf: string;
    username: string;
    email: string;
    password: string;

   
}
export class UserDto {
    @IsUUID()
    @IsOptional()
    id: string; 

    @IsString()
    @MinLength(3)
    @MaxLength(50)
    username: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(3)
    @MaxLength(20)
    password: string;

    @IsOptional()
    isVerified: boolean;

    @IsString()
    @MinLength(11)
    @MaxLength(11)
    cpf: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NotasDto)
    notas?: NotasDto[];
}