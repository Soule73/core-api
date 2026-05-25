import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Provides AES-256-GCM encryption and decryption for sensitive fields.
 * Requires ENCRYPTION_KEY env var (64 hex chars = 32 bytes).
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    const hexKey = process.env.ENCRYPTION_KEY ?? '';
    if (hexKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(hexKey)) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY must be 64 hex characters (32 bytes)',
      );
    }
    const keyBuffer = Buffer.from(hexKey, 'hex');
    if (keyBuffer.length !== 32) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY must decode to exactly 32 bytes',
      );
    }
    this.key = keyBuffer;
  }

  /**
   * Encrypts a plaintext string.
   * @returns base64-encoded string: iv:authTag:ciphertext
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [iv, authTag, encrypted].map((b) => b.toString('base64')).join(':');
  }

  /**
   * Decrypts a string produced by encrypt().
   * @returns Original plaintext
   */
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new InternalServerErrorException('Invalid ciphertext format');
    }
    const [ivB64, authTagB64, encryptedB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');

    const decipher = createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }
}
