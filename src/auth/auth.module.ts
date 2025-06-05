import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                transport: {
                    host: config.get<string>('MAIL_HOST'),
                    port: parseInt(
                        config.get<string>('MAIL_PORT') || '587',
                        10,
                    ),
                    secure: false,
                    auth: {
                        user: config.get<string>('MAIL_USER'),
                        pass: config.get<string>('MAIL_PASS'),
                    },
                    tls: {
                        rejectUnauthorized: false,
                    },
                    debug: true,
                    logger: true,
                },
                defaults: {
                    from: `"NestJS Mailer" <${config.get<string>('MAIL_USER')}>`,
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule {}
