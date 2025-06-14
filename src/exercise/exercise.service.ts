import {
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    BadRequestException,
    HttpStatus,
    HttpException,
    NotFoundException,
} from '@nestjs/common';
import { ApiResponse } from 'src/common/types/ApiResponse';
import { FirebaseService } from 'src/firebase/firebase.service';
import { calcKcal, calcPointsBasedPolicy } from './utils/calculator';
import { ExerciseResult } from './types/ExerciseResult';

@Injectable()
export class ExerciseService {
    private static pointsPolicy = {
        20: {
            M: [7.0, 9.0],
            W: [6.8, 8.0],
        },
        30: {
            M: [7.0, 9.0],
            W: [6.8, 8.0],
        },
        40: {
            M: [6.8, 8.8],
            W: [6.5, 7.8],
        },
        50: {
            M: [6.5, 8.1],
            W: [6.0, 7.1],
        },
        60: {
            M: [6.2, 7.4],
            W: [5.3, 6.3],
        },
        70: {
            M: [5.0, 6.5],
            W: [4.8, 5.5],
        },
    };
    constructor() {}

    async sendUserActivityTrace(
        uid: string,
        velocity: number,
        date: number,
        movetime: number,
    ): Promise<ApiResponse<ExerciseResult>> {
        const userRef = FirebaseService.db.ref(`users/${uid}`);
        const userSnapshot = await userRef.once('value');

        if (!userSnapshot.exists()) {
            throw new NotFoundException({
                statusCode: HttpStatus.NOT_FOUND,
                message: '서비스에 유저가 등록되어 있지 않습니다.',
                error: 'NO_USER',
            });
        }

        const userInfo = userSnapshot.val();
        if (!userInfo) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: '유저 정보를 찾을 수 없습니다.',
                error: 'NO_USERINFO',
            });
        }
        if (!userInfo.birth) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: '생년월일 정보가 없습니다.',
                error: 'NO_USER_BIRTH',
            });
        }
        if (!userInfo.sex) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: '성별 정보가 없습니다.',
                error: 'NO_USER_SEX',
            });
        }
        if (!userInfo.weight) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: '몸무게 정보가 없습니다.',
                error: 'NO_USER_WEIGHT',
            });
        }
        try {
            const realDate = new Date(date);
            const year = realDate.getFullYear();
            const month = String(realDate.getMonth() + 1).padStart(2, "0");
            const day = String(realDate.getDate()).padStart(2, "0");
            const hour = String(realDate.getHours()).padStart(2, "0");
            const minute = String(realDate.getMinutes()).padStart(2, "0");
            const seconds = String(realDate.getSeconds()).padStart(2, "0");
            const milliseconds = String(realDate.getMilliseconds()).padStart(3, "0");
            const points = calcPointsBasedPolicy(
                velocity,
                ExerciseService.pointsPolicy,
                userInfo.birth,
                userInfo.sex,
            );
            const kcal = calcKcal(velocity, userInfo.weight, movetime);

            // 운동 데이터를 트랜잭션으로 저장
            const exerciseRef = FirebaseService.db.ref(
                `exercise/${uid}/${year}${month}${day}/${hour}${minute}${seconds}${milliseconds}`
            );

            await exerciseRef.transaction((currentData) => {
                if (currentData === null) {
                    return {
                        velocity,
                        points,
                        kcal
                    };
                }
                return currentData;
            });

            return {
                statusCode: HttpStatus.OK,
                message: "운동 데이터가 성공적으로 처리되었습니다.",
                data: {
                    velocity,
                    points,
                    kcal
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            if (error.code === 'PERMISSION_DENIED') {
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: '데이터베이스 접근이 거부되었습니다.',
                    error: 'PERMISSION_DENIED',
                });
            }

            throw new InternalServerErrorException({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: '데이터베이스 서버 문제로 정보가 저장되지 않습니다.',
                error: 'INTERNAL_SERVER_ERROR',
            });
        }
    }
}
