import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { UserProfile } from './types/UserProfile';
import { FirebaseService } from 'src/firebase/firebase.service';
import { pointsPolicy } from 'src/common/constants/pointsPolicy';
import { ApiResponse } from 'src/common/types/ApiResponse';
import { UserCashes } from './types/UserOnlyCash';
import { UserDoing } from './types/UserOnlyDoing';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
    constructor() {}

    async getUserProfile(uid: string): Promise<ApiResponse<UserProfile>> {
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
            const name = userValue.name;
            const email = userValue.email;
            const birth = userValue.birth;
            const sex = userValue.sex;
            const weight = userValue.Weight;
            const dailyPoints = userValue.dailyPoints ?? 0;
            const monthPoints = userValue.monthPoints ?? 0;
            const cashes = userValue.cashes ?? 0;
            const tmpAge =
                Math.floor(
                    (new Date().getFullYear() -
                        parseInt(birth.substring(0, 4))) /
                        10,
                ) * 10;
            const age = tmpAge > 70 ? 70 : tmpAge < 20 ? 20 : tmpAge;
            const minGetPoint = pointsPolicy[age][sex][0];
            const maxGetPoint = pointsPolicy[age][sex][1];
            return {
                statusCode: 200,
                message: '유저의 정보가 정상적으로 조회되었습니다.',
                data: {
                    name,
                    email,
                    birth,
                    sex,
                    dailyPoints,
                    monthPoints,
                    cashes,
                    weight,
                    minGetPoint,
                    maxGetPoint,
                },
            };
        } catch (error) {
            throw UsersService.commonThrow(error);
        }
    }

    async getUserCashes(uid: string): Promise<ApiResponse<UserCashes>> {
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
            return {
                statusCode: HttpStatus.OK,
                message: '유저의 캐쉬가 정상적으로 조회되었습니다.',
                data: {
                    cashes: userValue.cashes ?? 0,
                },
            };
        } catch (error) {
            throw UsersService.commonThrow(error);
        }
    }

    async getDoing(uid: string): Promise<ApiResponse<UserDoing>> {
        try {
            const usersRef = FirebaseService.db.ref(`users/${uid}`);
            const usersSnapshot = await usersRef.once('value');
            if (!usersSnapshot.exists()) {
                throw new NotFoundException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: '유저 정보가 없습니다.',
                    error: 'NOT FOUND USER INFO',
                });
            }
            const userValue = usersSnapshot.val();
            return {
                statusCode: HttpStatus.OK,
                message: '유저의 운동 상황 조회를 완료했습니다.',
                data: {
                    doing: userValue.doing ?? false,
                },
            };
        } catch (error) {
            throw UsersService.commonThrow(error);
        }
    }

    async deleteUserInfo(uid: string): Promise<ApiResponse<void>> {
        try {
            const userRef = FirebaseService.db.ref(`users/${uid}`);
            const exerciseRef = FirebaseService.db.ref(`exercise/${uid}`);
            const userSnapshot = await userRef.once('value');
            if (!userSnapshot.exists()) {
                throw new NotFoundException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: '유저 정보가 없습니다.',
                    error: 'NOT FOUND USER INFO',
                });
            }
            const userValue = userSnapshot.val();
            if (userValue.doing === true) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: '현재 운동 중인 상태입니다.',
                    error: 'DOING EXERCISE',
                });
            }
            await userRef.remove();
            await exerciseRef.remove();
            await admin.auth().deleteUser(uid);
            return {
                statusCode: HttpStatus.OK,
                message: '회원탈퇴를 완료했습니다.',
            };
        } catch (error) {
            throw UsersService.commonThrow(error);
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
