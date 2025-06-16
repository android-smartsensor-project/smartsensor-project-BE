import {
	Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserProfile } from './types/UserProfile';
import { UserCashes } from './types/UserOnlyCash';
import { ApiResponse } from 'src/common/types/ApiResponse';
import { UserUidDto } from './dto/user-uid.dto';
import { UserDoing } from './types/UserOnlyDoing';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('info/:id')
    async getUserInfo(
        @Param('id') uid: string,
    ): Promise<ApiResponse<UserProfile>> {
        try {
            return await this.usersService.getUserProfile(uid);
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

    @Get('cash/:id')
    async getUserCashes(
        @Param('id') uid: string,
    ): Promise<ApiResponse<UserCashes>> {
        try {
            return await this.usersService.getUserCashes(uid);
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

	@Get('doing/:id')
	async getUserDoing(
		@Param('id') uid: string,
	): Promise<ApiResponse<UserDoing>> {
		try {
            return await this.usersService.getDoing(uid);
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

	@Delete('user')
	async deleteUserInfo(
		@Body() userUid: UserUidDto
	): Promise<ApiResponse<void>> {
		try {
			return await this.usersService.deleteUserInfo(userUid.uid);
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
