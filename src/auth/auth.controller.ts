import {
    Body,
    Controller,
    Post,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ReadEmailDto } from './dto/read-email.dto';
import { ReadEmailAuthDto } from './dto/read-email-authnumber.dto';
import { ReadEmailPasswordDto } from './dto/read-email-password.dto';
import { AuthService } from './auth.service';
import { ApiResponse } from 'src/common/types/ApiResponse';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('email')
    async requestEmailVerification(
        @Body() emailData: ReadEmailDto,
    ): Promise<ApiResponse<void>> {
        try {
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
    ): Promise<ApiResponse<void>> {
        try {
            const { email, mode, authNumber } = emailAndAuthData;

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

    @Post('reset')
    async updatePassword(
        @Body() emailAndPasswordData: ReadEmailPasswordDto
    ): Promise<ApiResponse<void>> {
        try {
            const {email, password} = emailAndPasswordData;
            return await this.authService.updatePassword(email, password);
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
}
