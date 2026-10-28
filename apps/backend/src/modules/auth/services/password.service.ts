import { BadRequestException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private readonly minLength = 12;
  private readonly maxLength = 128;

  async hashPassword(password: string): Promise<string> {
    this.validatePasswordPolicy(password);
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verifyPassword(hash: string, plainText: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainText);
    } catch {
      return false;
    }
  }

  validatePasswordPolicy(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new BadRequestException('Password tidak boleh kosong.');
    }

    if (password.length < this.minLength) {
      throw new BadRequestException(
        `Password minimal ${this.minLength} karakter untuk keamanan optimal.`,
      );
    }

    if (password.length > this.maxLength) {
      throw new BadRequestException(
        `Password maksimal ${this.maxLength} karakter.`,
      );
    }

    // Check trivial or commonly compromised sequences
    const trivialSequences = [
      'password123456',
      '123456789012',
      'qwertyuiopas',
      'admin1234567',
      'coolcare12345',
    ];

    const lower = password.toLowerCase();
    for (const seq of trivialSequences) {
      if (lower === seq) {
        throw new BadRequestException(
          'Password terlalu mudah ditebak. Silakan gunakan kombinasi yang lebih kuat atau passphrase.',
        );
      }
    }
  }
}
