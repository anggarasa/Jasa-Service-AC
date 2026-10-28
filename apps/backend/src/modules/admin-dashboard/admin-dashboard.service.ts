import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
    });
    if (!business) {
      throw new NotFoundException('Data bisnis tidak ditemukan.');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      totalToday,
      pendingCount,
      confirmedCount,
      inProgressCount,
      completedCount,
      cancelledCount,
      activeTechniciansCount,
      activeWorkOrdersCount,
      todayAppointments,
      recentBookings,
      recentWorkOrders,
      todayRevenueBookings,
    ] = await Promise.all([
      // Bookings scheduled today
      this.prisma.booking.count({
        where: {
          businessId: business.id,
          scheduledStartAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      // Status breakdown
      this.prisma.booking.count({
        where: { businessId: business.id, status: BookingStatus.PENDING },
      }),
      this.prisma.booking.count({
        where: {
          businessId: business.id,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.ASSIGNED] },
        },
      }),
      this.prisma.booking.count({
        where: { businessId: business.id, status: BookingStatus.IN_PROGRESS },
      }),
      this.prisma.booking.count({
        where: { businessId: business.id, status: BookingStatus.COMPLETED },
      }),
      this.prisma.booking.count({
        where: {
          businessId: business.id,
          status: { in: [BookingStatus.CANCELLED, BookingStatus.REJECTED] },
        },
      }),
      // Technicians
      this.prisma.technician.count({
        where: { businessId: business.id, isActive: true },
      }),
      // Active Work Orders
      this.prisma.workOrder.count({
        where: {
          businessId: business.id,
          status: { notIn: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED] },
        },
      }),
      // Today appointments
      this.prisma.booking.findMany({
        where: {
          businessId: business.id,
          scheduledStartAt: { gte: startOfToday, lte: endOfToday },
        },
        orderBy: { scheduledStartAt: 'asc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          customerAddress: { select: { id: true, district: true, city: true, fullAddress: true } },
          service: { select: { id: true, name: true } },
          technician: {
            include: { user: { select: { name: true } } },
          },
        },
      }),
      // Recent bookings
      this.prisma.booking.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          service: { select: { id: true, name: true } },
        },
      }),
      // Recent work orders
      this.prisma.workOrder.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          customer: { select: { name: true } },
          technician: {
            include: { user: { select: { name: true } } },
          },
        },
      }),
      // Revenue query
      this.prisma.booking.findMany({
        where: {
          businessId: business.id,
          scheduledStartAt: { gte: startOfToday, lte: endOfToday },
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.ASSIGNED,
              BookingStatus.IN_PROGRESS,
              BookingStatus.COMPLETED,
            ],
          },
        },
        select: { estimatedTotal: true },
      }),
    ]);

    const estimatedRevenueToday = todayRevenueBookings.reduce(
      (sum, b) => sum + (b.estimatedTotal ? Number(b.estimatedTotal) : 0),
      0,
    );

    return {
      metrics: {
        totalBookingsToday: totalToday,
        pendingBookings: pendingCount,
        confirmedBookings: confirmedCount,
        inProgressBookings: inProgressCount,
        completedBookings: completedCount,
        cancelledBookings: cancelledCount,
        activeTechnicians: activeTechniciansCount,
        activeWorkOrders: activeWorkOrdersCount,
        estimatedRevenueToday,
      },
      todayAppointments,
      recentBookings,
      recentWorkOrders,
    };
  }
}
