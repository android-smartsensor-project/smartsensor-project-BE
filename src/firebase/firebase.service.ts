import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    public static db: admin.database.Database;

    constructor(private readonly config: ConfigService) {}
    onModuleInit() {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: this.config.get<string>('FIREBASE_PROJECT_ID'),
                    clientEmail: this.config.get<string>(
                        'FIREBASE_CLIENT_EMAIL',
                    ),
                    privateKey: this.config
                        .get<string>('FIREBASE_PRIVATE_KEY')
                        ?.replace(/\\n/g, '\n'),
                }),
                databaseURL: this.config.get<string>('FIREBASE_DATABASE_URL'),
            });
        }
        FirebaseService.db = admin.database();
    }
}
