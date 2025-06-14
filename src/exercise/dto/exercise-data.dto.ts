import { IsNumber, IsString } from 'class-validator';

export class ExerciseDataDto {
    @IsString()
    readonly uid: string;
    @IsNumber()
    readonly velocity: number;
    @IsNumber()
    readonly date: number;
    @IsNumber()
    readonly movetime: number;
}
