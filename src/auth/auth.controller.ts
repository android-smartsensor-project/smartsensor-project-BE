import {
    BadRequestException,
    Body,
    Controller,
    Post,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ReadEmailDto } from './dto/read-email.dto';
import { ReadEmailAuthDto } from './dto/read-email-authnumber.dto';
import { AuthService } from './auth.service';

interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data?: T;
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('email')
    async requestEmailVerification(
        @Body() emailData: ReadEmailDto,
    ): Promise<ApiResponse<void>> {
        try {
            const emailRegEx =
                /^[A-Za-z0-9]([-_.]?[A-Za-z0-9])*@[A-Za-z0-9]([-_.]?[A-Za-z0-9])*\.[A-Za-z]{2,3}$/;

            if (!emailRegEx.test(emailData.email)) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: '유효하지 않은 이메일 형식입니다.',
                    error: 'INVALID_EMAIL_FORMAT',
                });
            }

            return await this.authService.sendEmailVeficationMail(
                emailData.email,
                emailData.mode,
            );
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: '이메일 인증 요청 중 오류가 발생했습니다.',
                    error: 'INTERNAL_SERVER_ERROR',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('verify')
    async verifyEmailWithAuthNumber(
        @Body() emailAndAuthData: ReadEmailAuthDto,
    ): Promise<ApiResponse<{ verified: boolean }>> {
        try {
            const { email, mode, authNumber } = emailAndAuthData;

            // 이메일 형식 검증
            const emailRegEx =
                /^[A-Za-z0-9]([-_.]?[A-Za-z0-9])*@[A-Za-z0-9]([-_.]?[A-Za-z0-9])*\.[A-Za-z]{2,3}$/;

            if (!emailRegEx.test(email)) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: '유효하지 않은 이메일 형식입니다.',
                    error: 'INVALID_EMAIL_FORMAT',
                });
            }

            // 인증번호 형식 검증 (6자리 숫자)
            if (!/^\d{6}$/.test(authNumber)) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: '유효하지 않은 인증번호 형식입니다.',
                    error: 'INVALID_AUTH_NUMBER_FORMAT',
                });
            }

            return await this.authService.verifyEmailWithAuthNumber(
                email,
                mode,
                authNumber,
            );
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: '이메일 인증 중 오류가 발생했습니다.',
                    error: 'INTERNAL_SERVER_ERROR',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
