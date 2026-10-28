import { PasswordService } from './password.service';
import { BadRequestException } from '@nestjs/common';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('should hash password using Argon2id and verify correctly', async () => {
    const raw = 'SecurePassphrase123!';
    const hash = await service.hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const isValid = await service.verifyPassword(hash, raw);
    expect(isValid).toBe(true);

    const isWrong = await service.verifyPassword(hash, 'WrongPassword456!');
    expect(isWrong).toBe(false);
  });

  it('should reject passwords shorter than 12 characters', async () => {
    await expect(service.hashPassword('Short123!')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject trivial compromised passwords', async () => {
    await expect(service.hashPassword('password123456')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.hashPassword('123456789012')).rejects.toThrow(
      BadRequestException,
    );
  });
});
