import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class NotasDto {
    @IsUUID()
    id: string; 

    @IsString()
    @IsNotEmpty()
    xml: string;
}