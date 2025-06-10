import { IsString } from 'class-validator';

export class ReadEmailPasswordDto {
    @IsString()
    readonly email: string;
    @IsString()
    readonly password: string;
}
