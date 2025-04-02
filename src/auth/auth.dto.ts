export class AuthResponseDto {
    token?: string; // Torna 'token' opcional
    expiresIn?: number;
    message?: string;
    completeCadastro?: boolean;
}