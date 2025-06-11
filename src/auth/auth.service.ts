import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    HttpStatus,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseService } from 'src/firebase/firebase.service';
import { createSHA256Hash } from 'src/utils/createSHA256Hash';

interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data?: T;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly mailerService: MailerService,
        private configService: ConfigService,
        private readonly firebaseService: FirebaseService,
    ) {}

    async sendEmailVeficationMail(
        to: string,
        mode: string,
    ): Promise<ApiResponse<void>> {
        try {
            const userSnapshot = await this.firebaseService.db
                .ref('users')
                .orderByChild('emailId')
                .equalTo(to)
                .once('value');

            if (userSnapshot.exists() && mode === 'signup') {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: '이미 등록된 이메일입니다.',
                    error: 'DUPLICATE_EMAIL',
                });
            }

            if (!userSnapshot.exists() && mode === 'reset') {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: '회원가입 되지 않은 이메일입니다.',
                    error: 'NO_SIGNUP_EMAIL',
                });
            }

            const authNumber = String(
                Math.floor(Math.random() * 1000000),
            ).padStart(6, '0');
            const createdAt = admin.database.ServerValue.TIMESTAMP;
            const expiresAt = Date.now() + 1000 * 60 * 5; // 5분
            const collectionByMode =
                mode === 'signup' ? 'email_verifications' : 'password_reset';
            const emailToHash = createSHA256Hash(to);

            await this.firebaseService.db
                .ref(`${collectionByMode}/${emailToHash}`)
                .set({ authNumber, createdAt, expiresAt });

            const result = await this.mailerService.sendMail({
                to,
                from: this.configService.get<string>('MAIL_USER'),
                subject:
                    mode === 'signup'
                        ? '워크앤런 회원가입 이메일 인증 메일입니다.'
                        : '워크앤런 비밀번호 재설정 메일입니다.',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">이메일 인증</h2>
                    <p>안녕하세요, 워크앤런입니다.</p>
                    <p>아래 인증번호를 입력하여 다음 단계를 진행해주세요:</p>
                    <p style="margin: 20px 0; font-size: 24px; font-weight: bold; color: #007bff;">
                        ${authNumber}
                    </p>
                    <p>인증번호는 5분 후에 만료됩니다.</p>
                    <p>감사합니다.</p>
                </div>`,
            });

            this.logger.log(`Email sent successfully to ${to}`);
            this.logger.debug('Email result:', result);

            return {
                statusCode: HttpStatus.OK,
                message: '인증 메일이 성공적으로 전송되었습니다.',
            };
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);

            if (error instanceof BadRequestException) {
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
                message: '이메일 전송 중 오류가 발생했습니다.',
                error: 'INTERNAL_SERVER_ERROR',
            });
        }
    }

    async verifyEmailWithAuthNumber(
        email: string,
        mode: string,
        authNumber: string,
    ): Promise<ApiResponse<void>> {
        try {
            const collectionByMode =
                mode === 'signup' ? 'email_verifications' : 'password_reset';
            const emailToHash = createSHA256Hash(email);
            const verificationRef = this.firebaseService.db.ref(
                `${collectionByMode}/${emailToHash}`,
            );

            const snapshot = await verificationRef.once('value');
            if (!snapshot.exists()) {
                throw new NotFoundException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: '인증 정보를 찾을 수 없습니다.',
                    error: 'VERIFICATION_NOT_FOUND',
                });
            }

            const verificationData = snapshot.val();
            if (!verificationData) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: '인증 데이터가 누락되었습니다.',
                    error: 'MISSING_VERIFICATION_DATA',
                });
            }

            if (!verificationData.expiresAt) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: '만료 시간이 누락되었습니다.',
                    error: 'MISSING_EXPIRATION_TIME',
                });
            }

            if (verificationData.expiresAt < Date.now()) {
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: '인증 시간이 만료되었습니다.',
                    error: 'VERIFICATION_EXPIRED',
                });
            }

            if (verificationData.authNumber !== authNumber) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: '잘못된 인증번호입니다.',
                    error: 'INVALID_AUTH_NUMBER',
                });
            }

            await verificationRef.remove();

            return {
                statusCode: HttpStatus.OK,
                message: '이메일 인증이 완료되었습니다.',
            };
        } catch (error) {
            this.logger.error('Email verification error:', error);

            if (
                error instanceof BadRequestException ||
                error instanceof ForbiddenException ||
                error instanceof NotFoundException
            ) {
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
                message: '이메일 인증 중 오류가 발생했습니다.',
                error: 'INTERNAL_SERVER_ERROR',
            });
        }
    }

    async updatePassword(
        email: string,
        password: string,
    ): Promise<ApiResponse<void>> {
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            await admin.auth().updateUser(userRecord.uid, {
                password: password,
            });
            const dbRef = admin.database().ref(`users/${userRecord.uid}`);
            await dbRef.update({ password: password });
            return {
                statusCode: HttpStatus.OK,
                message: '비밀번호가 재설정 되었습니다!',
            };
        } catch (error) {
            this.logger.error('Password reset error:', error);
            if (
                error instanceof BadRequestException ||
                error instanceof ForbiddenException ||
                error instanceof NotFoundException
            ) {
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
                message: '이메일 인증 중 오류가 발생했습니다.',
                error: 'INTERNAL_SERVER_ERROR',
            });
        }
    }
}
