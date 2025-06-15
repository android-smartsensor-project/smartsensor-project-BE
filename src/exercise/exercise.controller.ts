import {
    Body,
    Param,
    Controller,
    Get,
    Post,
    HttpException,
    HttpStatus,
    ValidationPipe,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseDataDto } from './dto/exercise-data.dto';
import { ApiResponse } from 'src/common/types/ApiResponse';
import { ExerciseResult } from './types/ExerciseResult';

@Controller('exercise')
export class ExerciseController {
    constructor(private readonly exerciseService: ExerciseService) {}

    @Get('info/:id')
    async getUserExerciseRecord(
        @Param('id') uid: string,
    ): Promise<ApiResponse<ExerciseResult>> {
        try {
            return await this.exerciseService.getUserExerciseRecord(uid);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: '서버 문제로 데이터를 받을 수 없습니다.',
                    error: 'INTERNAL_SERVER_ERROR',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('trace')
    async sendUserActivityTrace(
        @Body(new ValidationPipe({ transform: true }))
        exerciseData: ExerciseDataDto,
    ): Promise<ApiResponse<ExerciseResult>> {
        try {
            return await this.exerciseService.sendUserActivityTrace(exerciseData);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: '서버 문제로 데이터를 받을 수 없습니다.',
                    error: 'INTERNAL_SERVER_ERROR',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('start')
    async startUserExerciseActivity (
        @Body() uidData: { uid: string },
    ): Promise<ApiResponse<ExerciseResult>> {
        try {
            return await this.exerciseService.startUserExerciseActivity(uidData.uid);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: '서버 문제로 데이터를 받을 수 없습니다.',
                    error: 'INTERNAL_SERVER_ERROR',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('finish')
    async finishUserExerciseActivity(
        @Body() uidData: { uid: string },
    ): Promise<ApiResponse<ExerciseResult>> {
        try {
            return await this.exerciseService.finishUserExerciseActivity(uidData.uid);
        } catch(error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: '서버 문제로 데이터를 받을 수 없습니다.',
                    error: 'INTERNAL_SERVER_ERROR',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
