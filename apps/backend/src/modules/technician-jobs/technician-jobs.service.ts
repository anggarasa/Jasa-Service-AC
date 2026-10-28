import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  ChecklistItemStatus,
  InspectionStatus,
  MediaPurpose,
  WorkOrderPhotoCategory,
  WorkOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import {
  ArriveWorkOrderDto,
  CompleteWorkOrderDto,
  FollowUpWorkOrderDto,
  SaveServiceReportDto,
  SaveUnitInspectionDto,
  StartWorkOrderDto,
  TechnicianJobsQueryDto,
  UpdateChecklistItemDto,
} from './dto/technician-jobs.dto';

const STANDARD_CHECKLIST_ITEMS = [
  { label: 'Pemeriksaan fungsi remote & kelistrikan unit indoor', isRequired: true, displayOrder: 1 },
  { label: 'Pembersihan filter udara & penutup (cover) indoor unit', isRequired: true, displayOrder: 2 },
  { label: 'Pembersihan evaporator, blower fan & talang air', isRequired: true, displayOrder: 3 },
  { label: 'Pembersihan kondensor outdoor unit & kisi-kisi pendingin', isRequired: true, displayOrder: 4 },
  { label: 'Pemeriksaan & pengukuran tekanan freon (refrigerant PSI)', isRequired: true, displayOrder: 5 },
  { label: 'Pengukuran arus kerja kompresor (Ampere)', isRequired: true, displayOrder: 6 },
  { label: 'Pemeriksaan kelancaran jalur pipa pembuangan air (drainase)', isRequired: true, displayOrder: 7 },
  { label: 'Uji performa pendinginan & suhu hembusan udara (Delta T)', isRequired: true, displayOrder: 8 },
];

@Injectable()
export class TechnicianJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async resolveTechnician(userId: string) {
    const technician = await this.prisma.technician.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        business: { select: { id: true, name: true } },
      },
    });

    if (!technician || !technician.isActive) {
      throw new ForbiddenException(
        'Profil teknisi tidak ditemukan atau status akun teknisi belum aktif.',
      );
    }

    return technician;
  }

  async getDashboard(userId: string) {
    const technician = await this.resolveTechnician(userId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      assignedCount,
      onTheWayCount,
      arrivedCount,
      inProgressCount,
      completedTodayCount,
      todayJobs,
    ] = await Promise.all([
      this.prisma.workOrder.count({
        where: { technicianId: technician.id, status: WorkOrderStatus.ASSIGNED },
      }),
      this.prisma.workOrder.count({
        where: { technicianId: technician.id, status: WorkOrderStatus.ON_THE_WAY },
      }),
      this.prisma.workOrder.count({
        where: { technicianId: technician.id, status: WorkOrderStatus.ARRIVED },
      }),
      this.prisma.workOrder.count({
        where: { technicianId: technician.id, status: WorkOrderStatus.IN_PROGRESS },
      }),
      this.prisma.workOrder.count({
        where: {
          technicianId: technician.id,
          status: WorkOrderStatus.COMPLETED,
          completedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.workOrder.findMany({
        where: {
          technicianId: technician.id,
          OR: [
            {
              scheduledStartAt: { gte: todayStart, lte: todayEnd },
            },
            {
              status: {
                in: [
                  WorkOrderStatus.ASSIGNED,
                  WorkOrderStatus.ON_THE_WAY,
                  WorkOrderStatus.ARRIVED,
                  WorkOrderStatus.IN_PROGRESS,
                ],
              },
            },
          ],
        },
        orderBy: [{ scheduledStartAt: 'asc' }, { createdAt: 'asc' }],
        include: {
          customer: {
            select: { id: true, name: true, phone: true, normalizedPhone: true },
          },
          customerAddress: {
            select: { id: true, label: true, fullAddress: true, district: true, city: true, landmark: true },
          },
          booking: {
            select: { id: true, bookingCode: true, status: true, estimatedTotal: true },
          },
          items: {
            include: {
              acUnit: {
                select: { id: true, brand: true, model: true, type: true, capacityPk: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      technician: {
        id: technician.id,
        name: technician.user.name,
        email: technician.user.email,
        businessName: technician.business.name,
      },
      metrics: {
        assignedCount,
        onTheWayCount,
        arrivedCount,
        inProgressCount,
        completedTodayCount,
        activeTotal: assignedCount + onTheWayCount + arrivedCount + inProgressCount,
      },
      todayJobs,
    };
  }

  async getMyWorkOrders(userId: string, query: TechnicianJobsQueryDto) {
    const technician = await this.resolveTechnician(userId);

    const where: any = {
      technicianId: technician.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      const dStart = new Date(`${query.date}T00:00:00.000Z`);
      const dEnd = new Date(`${query.date}T23:59:59.999Z`);
      where.scheduledStartAt = { gte: dStart, lte: dEnd };
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { workOrderNumber: { contains: s, mode: 'insensitive' } },
        { customer: { name: { contains: s, mode: 'insensitive' } } },
        { customer: { normalizedPhone: { contains: s } } },
        { customerAddress: { fullAddress: { contains: s, mode: 'insensitive' } } },
        { customerAddress: { district: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(50, query.limit || 10));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.workOrder.count({ where }),
      this.prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ scheduledStartAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          customer: {
            select: { id: true, name: true, phone: true, normalizedPhone: true },
          },
          customerAddress: {
            select: { id: true, label: true, fullAddress: true, district: true, city: true },
          },
          booking: {
            select: { id: true, bookingCode: true, status: true, estimatedTotal: true },
          },
          items: {
            include: {
              acUnit: {
                select: { id: true, brand: true, model: true, type: true, capacityPk: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyWorkOrderDetail(userId: string, workOrderId: string) {
    const technician = await this.resolveTechnician(userId);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        technicianId: technician.id,
      },
      include: {
        customer: true,
        customerAddress: true,
        booking: {
          include: {
            service: true,
          },
        },
        items: {
          include: {
            acUnit: true,
            inspection: true,
            checklistItems: {
              orderBy: { displayOrder: 'asc' },
            },
            photos: {
              include: { mediaAsset: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        photos: {
          include: {
            mediaAsset: true,
            workOrderItem: {
              select: {
                id: true,
                serviceNameSnapshot: true,
                acUnit: { select: { brand: true, model: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        serviceReport: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(
        `Surat Perintah Kerja dengan ID ${workOrderId} tidak ditemukan atau bukan milik Anda.`,
      );
    }

    // Auto-initialize checklist items if items don't have them yet
    await this.ensureChecklistInitialized(workOrder);

    // Re-fetch items if any initialization happened
    const freshItems = await this.prisma.workOrderItem.findMany({
      where: { workOrderId: workOrder.id },
      include: {
        acUnit: true,
        inspection: true,
        checklistItems: {
          orderBy: { displayOrder: 'asc' },
        },
        photos: {
          include: { mediaAsset: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      ...workOrder,
      items: freshItems,
    };
  }

  private async ensureChecklistInitialized(workOrder: any) {
    for (const item of workOrder.items) {
      if (!item.checklistItems || item.checklistItems.length === 0) {
        let templateItems: any[] = [];
        if (item.serviceId) {
          const serviceTemplate = await this.prisma.serviceChecklistTemplate.findFirst({
            where: { serviceId: item.serviceId, isActive: true },
            include: { items: { orderBy: { displayOrder: 'asc' } } },
          });
          if (serviceTemplate && serviceTemplate.items.length > 0) {
            templateItems = serviceTemplate.items;
          }
        }

        if (templateItems.length === 0) {
          const businessTemplate = await this.prisma.serviceChecklistTemplate.findFirst({
            where: { businessId: workOrder.businessId, serviceId: null, isActive: true },
            include: { items: { orderBy: { displayOrder: 'asc' } } },
          });
          if (businessTemplate && businessTemplate.items.length > 0) {
            templateItems = businessTemplate.items;
          }
        }

        if (templateItems.length > 0) {
          await this.prisma.workOrderChecklistItem.createMany({
            data: templateItems.map((ti) => ({
              workOrderId: workOrder.id,
              workOrderItemId: item.id,
              templateItemId: ti.id,
              labelSnapshot: ti.label,
              descriptionSnapshot: ti.description,
              isRequiredSnapshot: ti.isRequired,
              displayOrder: ti.displayOrder,
              status: ChecklistItemStatus.NOT_STARTED,
            })),
          });
        } else {
          await this.prisma.workOrderChecklistItem.createMany({
            data: STANDARD_CHECKLIST_ITEMS.map((si) => ({
              workOrderId: workOrder.id,
              workOrderItemId: item.id,
              labelSnapshot: si.label,
              descriptionSnapshot: null,
              isRequiredSnapshot: si.isRequired,
              displayOrder: si.displayOrder,
              status: ChecklistItemStatus.NOT_STARTED,
            })),
          });
        }
      }
    }
  }

  async startJourney(userId: string, workOrderId: string) {
    const technician = await this.resolveTechnician(userId);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, technicianId: technician.id },
    });

    if (!workOrder) {
      throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
    }

    if (workOrder.status !== WorkOrderStatus.ASSIGNED) {
      throw new BadRequestException(
        `Perjalanan teknisi hanya dapat dimulai saat status SPK masih ${WorkOrderStatus.ASSIGNED}. Status saat ini: ${workOrder.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: WorkOrderStatus.ON_THE_WAY,
        },
      });

      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId,
          fromStatus: workOrder.status,
          toStatus: WorkOrderStatus.ON_THE_WAY,
          reason: 'Teknisi dalam perjalanan menuju lokasi pelanggan',
          actorUserId: userId,
        },
      });

      return wo;
    });

    return updated;
  }

  async arrive(userId: string, workOrderId: string, dto: ArriveWorkOrderDto) {
    const technician = await this.resolveTechnician(userId);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, technicianId: technician.id },
    });

    if (!workOrder) {
      throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
    }

    if (
      workOrder.status !== WorkOrderStatus.ON_THE_WAY &&
      workOrder.status !== WorkOrderStatus.ASSIGNED
    ) {
      throw new BadRequestException(
        `Check-in kedatangan hanya berlaku dari status ${WorkOrderStatus.ON_THE_WAY} atau ${WorkOrderStatus.ASSIGNED}. Status saat ini: ${workOrder.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: WorkOrderStatus.ARRIVED,
          arrivedAt: new Date(),
        },
      });

      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId,
          fromStatus: workOrder.status,
          toStatus: WorkOrderStatus.ARRIVED,
          reason: dto.notes ? `Tiba di lokasi: ${dto.notes}` : 'Teknisi tiba di lokasi pelanggan',
          actorUserId: userId,
        },
      });

      return wo;
    });

    return updated;
  }

  async startWork(userId: string, workOrderId: string, dto: StartWorkOrderDto) {
    const technician = await this.resolveTechnician(userId);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, technicianId: technician.id },
    });

    if (!workOrder) {
      throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
    }

    if (
      workOrder.status !== WorkOrderStatus.ARRIVED &&
      workOrder.status !== WorkOrderStatus.ON_THE_WAY &&
      workOrder.status !== WorkOrderStatus.ASSIGNED
    ) {
      throw new BadRequestException(
        `Pengerjaan servis hanya dapat dimulai dari status ${WorkOrderStatus.ARRIVED}. Status saat ini: ${workOrder.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: WorkOrderStatus.IN_PROGRESS,
          startedAt: workOrder.startedAt || new Date(),
          arrivedAt: workOrder.arrivedAt || new Date(),
        },
      });

      // Sync booking status to IN_PROGRESS
      await tx.booking.update({
        where: { id: workOrder.bookingId },
        data: { status: BookingStatus.IN_PROGRESS },
      });

      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId,
          fromStatus: workOrder.status,
          toStatus: WorkOrderStatus.IN_PROGRESS,
          reason: dto.notes ? `Mulai pengerjaan: ${dto.notes}` : 'Teknisi mulai melakukan servis AC',
          actorUserId: userId,
        },
      });

      return wo;
    });

    return updated;
  }

  async saveUnitInspection(
    userId: string,
    workOrderId: string,
    workOrderItemId: string,
    dto: SaveUnitInspectionDto,
  ) {
    const technician = await this.resolveTechnician(userId);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, technicianId: technician.id },
    });

    if (!workOrder) {
      throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
    }

    if (
      workOrder.status !== WorkOrderStatus.ARRIVED &&
      workOrder.status !== WorkOrderStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Inspeksi AC hanya dapat diisi saat status SPK ${WorkOrderStatus.ARRIVED} atau ${WorkOrderStatus.IN_PROGRESS}.`,
      );
    }

    const workOrderItem = await this.prisma.workOrderItem.findFirst({
      where: { id: workOrderItemId, workOrderId },
    });

    if (!workOrderItem) {
      throw new NotFoundException('Item pekerjaan AC tidak ditemukan pada SPK ini.');
    }

    const inspection = await this.prisma.workOrderUnitInspection.upsert({
      where: { workOrderItemId },
      create: {
        workOrderId,
        workOrderItemId,
        acUnitId: workOrderItem.acUnitId || null,
        inspectionStatus: dto.inspectionStatus || InspectionStatus.NOT_INSPECTED,
        reportedComplaint: dto.reportedComplaint || null,
        observedCondition: dto.observedCondition || null,
        diagnosis: dto.diagnosis || null,
        recommendedAction: dto.recommendedAction || null,
        requiresFollowUp: dto.requiresFollowUp || false,
        inspectedAt: new Date(),
        inspectedByUserId: userId,
      },
      update: {
        inspectionStatus: dto.inspectionStatus,
        reportedComplaint: dto.reportedComplaint,
        observedCondition: dto.observedCondition,
        diagnosis: dto.diagnosis,
        recommendedAction: dto.recommendedAction,
        requiresFollowUp: dto.requiresFollowUp,
        inspectedAt: new Date(),
        inspectedByUserId: userId,
      },
    });

    return inspection;
  }

  async updateChecklistItem(
    userId: string,
    workOrderId: string,
    checklistItemId: string,
    dto: UpdateChecklistItemDto,
  ) {
    const technician = await this.resolveTechnician(userId);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, technicianId: technician.id },
    });

    if (!workOrder) {
      throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
    }

    if (
      workOrder.status !== WorkOrderStatus.ARRIVED &&
      workOrder.status !== WorkOrderStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Checklist hanya dapat diperbarui saat status ${WorkOrderStatus.ARRIVED} atau ${WorkOrderStatus.IN_PROGRESS}.`,
      );
    }

    const checklistItem = await this.prisma.workOrderChecklistItem.findFirst({
      where: {
        id: checklistItemId,
        workOrderId,
      },
    });

    if (!checklistItem) {
      throw new NotFoundException('Item checklist tidak ditemukan pada SPK ini.');
    }

    const updated = await this.prisma.workOrderChecklistItem.update({
      where: { id: checklistItemId },
      data: {
        status: dto.status,
        notes: dto.notes || null,
        completedAt: dto.status === ChecklistItemStatus.DONE ? new Date() : null,
        completedByUserId: userId,
      },
    });

    return updated;
  }

  async uploadPhoto(
    userId: string,
    workOrderId: string,
    fileBuffer: Buffer,
    originalName: string,
    category: WorkOrderPhotoCategory,
    workOrderItemId?: string,
    caption?: string,
  ) {
    const technician = await this.resolveTechnician(userId);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, technicianId: technician.id },
    });

    if (!workOrder) {
      throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
    }

    if (workOrder.status === WorkOrderStatus.COMPLETED || workOrder.status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException(
        `Tidak dapat mengunggah foto pada SPK yang berstatus ${workOrder.status}.`,
      );
    }

    if (workOrderItemId) {
      const item = await this.prisma.workOrderItem.findFirst({
        where: { id: workOrderItemId, workOrderId },
      });
      if (!item) {
        throw new BadRequestException('Item AC tidak terhubung dengan SPK ini.');
      }
    }

    const validated = this.storage.validateImage(fileBuffer);
    const subFolder = category.toLowerCase();
    const folder = `work-orders/photos/${subFolder}/` as any;

    const { objectKey } = await this.storage.uploadObject(
      folder,
      validated.buffer,
      originalName || `photo.${validated.extension}`,
      validated.mimeType,
    );

    const mediaAsset = await this.prisma.mediaAsset.create({
      data: {
        businessId: workOrder.businessId,
        objectKey,
        bucket: this.storage.getBucketName(),
        mimeType: validated.mimeType,
        fileSize: validated.size,
        purpose: MediaPurpose.WORK_ORDER_PHOTO,
        createdByUserId: userId,
      },
    });

    const photo = await this.prisma.workOrderPhoto.create({
      data: {
        workOrderId,
        workOrderItemId: workOrderItemId || null,
        mediaAssetId: mediaAsset.id,
        category,
        caption: caption || null,
        uploadedByUserId: userId,
      },
      include: {
        mediaAsset: true,
      },
    });

    return photo;
  }

  async deletePhoto(userId: string, workOrderId: string, photoId: string) {
    const technician = await this.resolveTechnician(userId);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, technicianId: technician.id },
    });

    if (!workOrder) {
      throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
    }

    if (workOrder.status === WorkOrderStatus.COMPLETED) {
      throw new BadRequestException('Foto tidak dapat dihapus karena pekerjaan telah selesai.');
    }

    const photo = await this.prisma.workOrderPhoto.findFirst({
      where: { id: photoId, workOrderId },
      include: { mediaAsset: true },
    });

    if (!photo) {
      throw new NotFoundException('Foto pengerjaan tidak ditemukan.');
    }

    await this.prisma.workOrderPhoto.delete({
      where: { id: photoId },
    });

    if (photo.mediaAsset) {
      await this.storage.deleteObject(photo.mediaAsset.objectKey);
      await this.prisma.mediaAsset.delete({
        where: { id: photo.mediaAssetId },
      });
    }

    return { message: 'Foto pengerjaan berhasil dihapus' };
  }

  async getPhotoContent(userId: string, workOrderId: string, photoId: string, isAdmin = false) {
    if (!isAdmin) {
      const technician = await this.resolveTechnician(userId);
      const wo = await this.prisma.workOrder.findFirst({
        where: { id: workOrderId, technicianId: technician.id },
      });
      if (!wo) {
        throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
      }
    }

    const photo = await this.prisma.workOrderPhoto.findFirst({
      where: { id: photoId, workOrderId },
      include: { mediaAsset: true },
    });

    if (!photo || !photo.mediaAsset) {
      throw new NotFoundException('Foto pengerjaan tidak ditemukan.');
    }

    const stream = await this.storage.getObjectStream(photo.mediaAsset.objectKey);
    const presignedUrl = await this.storage.getPresignedDownloadUrl(photo.mediaAsset.objectKey);

    return {
      stream,
      presignedUrl,
      asset: photo.mediaAsset,
    };
  }

  async saveServiceReport(userId: string, workOrderId: string, dto: SaveServiceReportDto) {
    const technician = await this.resolveTechnician(userId);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, technicianId: technician.id },
    });

    if (!workOrder) {
      throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
    }

    if (
      workOrder.status !== WorkOrderStatus.ARRIVED &&
      workOrder.status !== WorkOrderStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Laporan servis hanya dapat diisi saat status SPK ${WorkOrderStatus.ARRIVED} atau ${WorkOrderStatus.IN_PROGRESS}.`,
      );
    }

    const report = await this.prisma.workOrderServiceReport.upsert({
      where: { workOrderId },
      create: {
        workOrderId,
        summary: dto.summary,
        workPerformed: dto.workPerformed,
        issuesFound: dto.issuesFound || null,
        recommendations: dto.recommendations || null,
        customerSignedName: dto.customerSignedName || null,
        technicianSignedName: dto.technicianSignedName || null,
        isCompleted: dto.isCompleted || false,
        completedAt: dto.isCompleted ? new Date() : null,
      },
      update: {
        summary: dto.summary,
        workPerformed: dto.workPerformed,
        issuesFound: dto.issuesFound,
        recommendations: dto.recommendations,
        customerSignedName: dto.customerSignedName,
        technicianSignedName: dto.technicianSignedName,
        isCompleted: dto.isCompleted,
        completedAt: dto.isCompleted ? new Date() : null,
      },
    });

    return report;
  }

  async completeWorkOrder(userId: string, workOrderId: string, dto: CompleteWorkOrderDto) {
    const technician = await this.resolveTechnician(userId);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, technicianId: technician.id },
      include: {
        items: {
          include: {
            inspection: true,
            checklistItems: true,
          },
        },
        photos: true,
        serviceReport: true,
      },
    });

    if (!workOrder) {
      throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
    }

    if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Penyelesaian pekerjaan hanya dapat dilakukan jika status SPK ${WorkOrderStatus.IN_PROGRESS}. Status saat ini: ${workOrder.status}`,
      );
    }

    // Validation Gate 1: Inspeksi Unit
    for (const item of workOrder.items) {
      if (!item.inspection || item.inspection.inspectionStatus === InspectionStatus.NOT_INSPECTED) {
        throw new BadRequestException(
          `Semua unit AC wajib diinspeksi sebelum menyelesaikan pekerjaan. Unit "${item.serviceNameSnapshot}" belum lengkap diinspeksi.`,
        );
      }
    }

    // Validation Gate 2: Required Checklist Items
    for (const item of workOrder.items) {
      const pendingRequired = item.checklistItems.filter(
        (ci) => ci.isRequiredSnapshot && ci.status === ChecklistItemStatus.NOT_STARTED,
      );
      if (pendingRequired.length > 0) {
        throw new BadRequestException(
          `Terdapat ${pendingRequired.length} item checklist wajib yang masih belum diselesaikan pada unit "${item.serviceNameSnapshot}".`,
        );
      }
    }

    // Validation Gate 3: Service Report
    if (!workOrder.serviceReport || !workOrder.serviceReport.summary || !workOrder.serviceReport.workPerformed) {
      throw new BadRequestException(
        'Laporan servis (Ringkasan & Tindakan yang diambil) wajib diisi sebelum menyelesaikan SPK.',
      );
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: WorkOrderStatus.COMPLETED,
          completedAt: now,
          technicianNotes: dto.technicianNotes || workOrder.technicianNotes,
        },
      });

      // Update Service Report signature if provided
      if (dto.customerSignedName || dto.technicianSignedName) {
        await tx.workOrderServiceReport.update({
          where: { workOrderId },
          data: {
            customerSignedName: dto.customerSignedName || workOrder.serviceReport?.customerSignedName,
            technicianSignedName: dto.technicianSignedName || workOrder.serviceReport?.technicianSignedName,
            isCompleted: true,
            completedAt: now,
          },
        });
      }

      // Update booking
      await tx.booking.update({
        where: { id: workOrder.bookingId },
        data: {
          status: BookingStatus.COMPLETED,
        },
      });

      // Status history
      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId,
          fromStatus: workOrder.status,
          toStatus: WorkOrderStatus.COMPLETED,
          reason: 'Pekerjaan servis diselesaikan oleh teknisi di lapangan',
          actorUserId: userId,
        },
      });

      // Booking Audit
      await tx.bookingAuditLog.create({
        data: {
          bookingId: workOrder.bookingId,
          action: 'WORK_ORDER_COMPLETED',
          fromStatus: BookingStatus.IN_PROGRESS,
          toStatus: BookingStatus.COMPLETED,
          actorUserId: userId,
          details: { workOrderNumber: workOrder.workOrderNumber },
        },
      });

      return wo;
    });

    return updated;
  }

  async followUpWorkOrder(userId: string, workOrderId: string, dto: FollowUpWorkOrderDto) {
    const technician = await this.resolveTechnician(userId);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, technicianId: technician.id },
    });

    if (!workOrder) {
      throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
    }

    if (
      workOrder.status !== WorkOrderStatus.IN_PROGRESS &&
      workOrder.status !== WorkOrderStatus.ARRIVED
    ) {
      throw new BadRequestException(
        `Status Tindak Lanjut hanya dapat diajukan saat pengerjaan berlangsung (${WorkOrderStatus.IN_PROGRESS} / ${WorkOrderStatus.ARRIVED}).`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: WorkOrderStatus.FOLLOW_UP_REQUIRED,
          followUpReason: dto.reason,
          followUpNotes: dto.notes || null,
        },
      });

      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId,
          fromStatus: workOrder.status,
          toStatus: WorkOrderStatus.FOLLOW_UP_REQUIRED,
          reason: `Memerlukan tindak lanjut: ${dto.reason}`,
          actorUserId: userId,
        },
      });

      return wo;
    });

    return updated;
  }
}
