import { Body, Controller, Post, HttpException, HttpStatus } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseDataDto } from './dto/exercise-data.dto';
import { ApiResponse } from 'src/common/types/ApiResponse';
import { ExerciseResult } from './types/ExerciseResult';

@Controller('exercise')
export class ExerciseController {
    constructor(private readonly exerciseService: ExerciseService) {}

    @Post('trace')
    async sendUserActivityTrace(
        @Body() exerciseData: ExerciseDataDto,
    ): Promise<ApiResponse<ExerciseResult>> {
		const {uid, velocity, date, movetime} = exerciseData;
		try {
			return await this.exerciseService.sendUserActivityTrace(uid, velocity, date, movetime);
		} catch (error) {
			if (error instanceof HttpException) {
                throw error;
            }
			throw new HttpException(
				{
					statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
					message: '서버 문제로 데이터를 받을 수 없습니다.',
					error: "INTERNAL_SERVER_ERROR"
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}
}
