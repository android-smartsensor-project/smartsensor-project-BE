import { IsString } from 'class-validator';

export class ReadEmailDto {
    @IsString()
    readonly email: string;
    @IsString()
    readonly mode: string;
}
