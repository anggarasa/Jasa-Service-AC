import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class BookingAccessService {
  generateToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = this.hashToken(token);
    return { token, hash };
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }
}
