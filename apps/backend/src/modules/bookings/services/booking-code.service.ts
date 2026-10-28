import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class BookingCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async generateCode(): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePrefix = `ACB-${yyyy}${mm}${dd}`;

    for (let attempts = 0; attempts < 10; attempts++) {
      const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 chars
      const candidate = `${datePrefix}-${randomSuffix}`;

      const existing = await this.prisma.booking.findUnique({
        where: { bookingCode: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }
    }

    // Fallback if collision
    return `${datePrefix}-${Date.now().toString().slice(-4)}`;
  }
}
