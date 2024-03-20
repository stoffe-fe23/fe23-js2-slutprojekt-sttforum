import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export function generatePasswordHash(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, process.env.PASSWORD_SALT + salt, 10000, 64, 'sha512').toString('hex');
}

export function generateRandomSalt(): string {
    return crypto.randomBytes(32).toString('hex');
}