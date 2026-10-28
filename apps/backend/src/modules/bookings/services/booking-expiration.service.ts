import { Injectable, Logger } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class BookingExpirationService {
  private readonly logger = new Logger(BookingExpirationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processExpiredHolds(): Promise<number> {
    const now = new Date();
    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        expiresAt: { lt: now },
      },
      select: { id: true, bookingCode: true },
    });

    if (expiredBookings.length === 0) {
      return 0;
    }

    let processedCount = 0;

    for (const booking of expiredBookings) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Double check status inside transaction
          const current = await tx.booking.findUnique({
            where: { id: booking.id },
            select: { status: true },
          });

          if (current?.status !== BookingStatus.PENDING) {
            return;
          }

          await tx.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.EXPIRED },
          });

          await tx.resourceOccupancy.updateMany({
            where: { bookingId: booking.id, status: 'ACTIVE' },
            data: { status: 'RELEASED' },
          });

          await tx.bookingStatusHistory.create({
            data: {
              bookingId: booking.id,
              fromStatus: BookingStatus.PENDING,
              toStatus: BookingStatus.EXPIRED,
              reason: 'Batas waktu penahanan slot pemesanan (hold) telah kedaluwarsa.',
            },
          });

          processedCount++;
        });
      } catch (err) {
        this.logger.error(`Gagal memproses kedaluwarsa booking ${booking.bookingCode}:`, err);
      }
    }

    if (processedCount > 0) {
      this.logger.log(`Berhasil membebaskan kapasitas untuk ${processedCount} pemesanan kedaluwarsa.`);
    }

    return processedCount;
  }
}
