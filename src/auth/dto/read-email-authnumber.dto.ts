import { IsString } from 'class-validator';
import { ReadEmailDto } from './read-email.dto';

export class ReadEmailAuthDto {
    @IsString()
    readonly email: string;
    @IsString()
    readonly mode: string;
    @IsString()
    readonly authNumber: string;
}
