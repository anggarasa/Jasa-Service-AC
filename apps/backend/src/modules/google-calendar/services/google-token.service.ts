import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class GoogleTokenService {
  private readonly logger = new Logger(GoogleTokenService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const rawKey =
      this.config.get<string>('google.tokenEncryptionKey') ||
      process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ||
      'tampilkit_gcal_aes256_key_32_bytes_len!';

    // Ensure 32 bytes key for AES-256
    this.key = crypto.createHash('sha256').update(rawKey).digest();
  }

  encrypt(plaintext: string): string {
    if (!plaintext) return '';
    const iv = crypto.randomBytes(12); // 96-bit nonce for GCM
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${ciphertext}`;
  }

  decrypt(encryptedPayload: string): string {
    if (!encryptedPayload) return '';
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      throw new Error('Format token terenkripsi tidak valid.');
    }
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
