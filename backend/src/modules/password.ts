/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    password.ts
    Functions for generating random user password salt values and password hashes. 
*/
import crypto from 'crypto';
import dotenv from 'dotenv';

// Read environment variables from the .env file in the backend root. 
// Accessed via process.env.* below. 
dotenv.config();


////////////////////////////////////////////////////////////////////////////////////
// Generate a 128 character hash value from the specified password with the user-unique salt value.
// Password salt is combo of unique per-user salt and global environment salt. 
// (Only used during user login and registration so performance hit should not be severe
// enough to warrant the headache of async function use at this point.)
export function generatePasswordHash(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, process.env.PASSWORD_SALT + salt, 10000, 64, 'sha512').toString('hex');
}


////////////////////////////////////////////////////////////////////////////////////
// Generate a 64 characters long unique password salt value for a user. 
export function generateRandomSalt(): string {
    return crypto.randomBytes(32).toString('hex');
}