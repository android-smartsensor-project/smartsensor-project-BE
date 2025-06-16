import {
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    BadRequestException,
    HttpStatus,
    HttpException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { ApiResponse } from 'src/common/types/ApiResponse';
import { FirebaseService } from 'src/firebase/firebase.service';
import { calcKcal, calcPointsBasedPolicy } from './utils/calculator';
import { ExerciseResult } from './types/ExerciseResult';
import { ExerciseDataDto } from './dto/exercise-data.dto';
import { dateStr, timeStr } from 'src/common/utils/dates';
import { DailyPointsResponse } from './types/DailyPointsResponse';
import { pointsPolicy } from 'src/common/constants/pointsPolicy';

@Injectable()
export class ExerciseService {
    constructor() {}

    async getUserExerciseRecord(
        uid: string,
    ): Promise<ApiResponse<ExerciseResult>> {
        try {
            const curDate = dateStr();
            const exerciseRef = FirebaseService.db.ref(
                `exercise/${uid}/done/${curDate}`,
            );
            Logger.debug(uid);
            Logger.debug(curDate);
            const snapshot = await exerciseRef.once('value');
            if (!snapshot.exists()) {
                return {
                    statusCode: HttpStatus.OK,
                    message: '활동 기록이 없습니다. 1',
                };
            }
            const userData = snapshot.val();
            if (!userData) {
                return {
                    statusCode: HttpStatus.OK,
                    message: '활동 기록이 없습니다. 2',
                };
            }
            return {
                statusCode: HttpStatus.OK,
                message: '활동 기록 조회를 완료했습니다.',
                data: userData,
            };
        } catch (error) {
            throw ExerciseService.commonThrow(error);
        }
    }

    async getUserDailyPoints(
        uid: string,
    ): Promise<ApiResponse<DailyPointsResponse>> {
        try {
            const userRef = FirebaseService.db.ref(`users/${uid}`);
            const userSnapshot = await userRef.once('value');
            if (!userSnapshot.exists()) {
                throw new NotFoundException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: '유저 정보가 없습니다.',
                    error: 'NOT FOUND USER INFO',
                });
            }
            const userValue = userSnapshot.val();
            const dailyPoints = userValue.dailyPoints ?? 0;
            return {
                statusCode: HttpStatus.OK,
                message: "포인트를 정상적으로 조회했습니다.",
                data: {
                    dailyPoints
                }
            }
        } catch (error) {
            throw ExerciseService.commonThrow(error);
        }
    }

    async sendUserActivityTrace(
        data: ExerciseDataDto,
    ): Promise<ApiResponse<ExerciseResult>> {
        const { uid, velocity, date, movetime } = data;
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
            const accessDate = dateStr(date);
            const accessTime = timeStr(date);
            const points = calcPointsBasedPolicy(
                velocity,
                pointsPolicy,
                userInfo.birth,
                userInfo.sex,
            );
            const kcal = calcKcal(velocity, userInfo.weight, movetime);
            const exerciseRef = FirebaseService.db.ref(
                `exercise/${uid}/doing/${accessDate}/${accessTime}`,
            );

            await exerciseRef.transaction((currentData) => {
                if (currentData === null) {
                    return {
                        velocity,
                        points,
                        kcal,
                        movetime
                    };
                }
                return currentData;
            });

            return {
                statusCode: HttpStatus.OK,
                message: '운동 데이터가 성공적으로 처리되었습니다.',
                data: {
                    velocity,
                    points,
                    kcal,
                },
            };
        } catch (error) {
            throw ExerciseService.commonThrow(error);
        }
    }

    async startUserExerciseActivity(
        uid: string,
    ): Promise<ApiResponse<ExerciseResult>> {
        try {
            const userRef = FirebaseService.db.ref(`users/${uid}`);
            const userSnapshot = await userRef.once('value');
            if (!userSnapshot.exists()) {
                throw new NotFoundException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: '유저 정보가 없습니다.',
                    error: 'NOT FOUND USER INFO',
                });
            }
            await userRef.transaction((currentData) => {
                return { ...currentData, doing: true };
            });
            return {
                statusCode: 200,
                message: '활동을 시작합니다.',
            };
        } catch (error) {
            throw ExerciseService.commonThrow(error);
        }
    }

    async finishUserExerciseActivity(
        uid: string,
    ): Promise<ApiResponse<ExerciseResult>> {
        try {
            const userRef = FirebaseService.db.ref(`users/${uid}`);
            const userSnapshot = await userRef.once('value');
            if (!userSnapshot.exists()) {
                throw new NotFoundException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: '유저 정보가 없습니다.',
                    error: 'NOT FOUND USER INFO',
                });
            }
            const userValue = userSnapshot.val();
            const doingRecordsRef = FirebaseService.db.ref(
                `exercise/${uid}/doing`,
            );
            const doingSnapshot = await doingRecordsRef.once('value');
            if (!userSnapshot.exists()) {
                throw new NotFoundException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: '유저 정보가 없습니다.',
                    error: 'NOT FOUND USER INFO',
                });
            }
            const doingValue = doingSnapshot.val();
            if (!doingValue) {
                return {
                    statusCode: HttpStatus.OK,
                    message: '활동을 종료합니다.',
                    data: {
                        velocity: 0,
                        points: 0,
                        kcal: 0,
                    },
                };
            }
            const doingMonths = Object.keys(doingValue);
            Logger.debug(doingMonths);
            let tmpPoints: number = 0;
            let totalKcal: number = 0;
            let avgVelo: number = 0;
            const todayDate = dateStr();
            doingMonths.forEach(async (month) => {
                tmpPoints = 0;
                totalKcal = 0;
                avgVelo = 0;
                const timesInfo = doingValue[month];
                const times = Object.keys(timesInfo);
                times.forEach((time) => {
                    tmpPoints += timesInfo[time].points;
                    totalKcal += timesInfo[time].kcal;
                    avgVelo += timesInfo[time].velocity;
                });
                if (times.length != 0) avgVelo /= times.length;
                const updatePoints = userRef.transaction((currentData) => {
                    const updatedData = {
                        ...currentData,
                        dailyPoints: (userValue?.dailyPoints || 0) + tmpPoints,
                        monthPoints:
                            (userValue?.monthPoints || 0) +
                            ((userValue?.dailyPoints || 0) +
                                (tmpPoints > 10000 ? tmpPoints - 10000 : 0)),
                    };
                    return updatedData;
                });
                const updateCashes = userRef.transaction((currentData) => {
                    if (todayDate !== month) {
                        const prevCashes = userValue?.cashes ?? 0;
                        const prevDailyPoints = userValue?.dailyPoints ?? 0;
                        return {
                            ...currentData,
                            cashes:
                                prevCashes +
                                (prevDailyPoints > 10000
                                    ? prevCashes + 500
                                    : prevCashes +
                                      Math.floor(prevDailyPoints / 20)),
                            dailyPoints: 0,
                        };
                    }
                });

                await updatePoints;
                await updateCashes;
            });
            doingMonths.forEach(async (month) => {
                const donePart = FirebaseService.db
                    .ref(`exercise/${uid}/done/${month}`)
                    .transaction((currentData) => {
                        const timesInfo = doingValue[month];
                        return {
                            ...currentData,
                            ...timesInfo,
                        };
                    });
                const doingPart = FirebaseService.db
                    .ref(`exercise/${uid}/doing/${month}`)
                    .remove();
                await donePart;
                await doingPart;
            });
            await userRef.transaction((current) => {
                return {
                    ...current,
                    doing: false,
                };
            });
            return {
                statusCode: 200,
                message: '활동을 종료합니다',
                data: {
                    velocity: avgVelo,
                    points: tmpPoints,
                    kcal: totalKcal,
                },
            };
        } catch (error) {
            Logger.debug(error);
            Logger.debug(uid);
            throw ExerciseService.commonThrow(error);
        }
    }

    private static commonThrow(error: Error): void {
        if (error instanceof HttpException) {
            throw error;
        }
        if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'PERMISSION_DENIED'
        ) {
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
