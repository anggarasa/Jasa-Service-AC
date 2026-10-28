import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaPurpose } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AllowedStoragePath, StorageService } from '../../infrastructure/storage/storage.service';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async getBusinessId(): Promise<string> {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!business) {
      throw new NotFoundException('Data bisnis belum diinisialisasi.');
    }
    return business.id;
  }

  async uploadMedia(
    fileBuffer: Buffer,
    originalName: string,
    purpose: MediaPurpose = MediaPurpose.GALLERY_IMAGE,
    userId?: string,
  ) {
    const businessId = await this.getBusinessId();
    const validated = this.storage.validateImage(fileBuffer);

    let folder: AllowedStoragePath = 'gallery/images/';
    if (purpose === MediaPurpose.BUSINESS_LOGO) {
      folder = 'business/logos/';
    } else if (purpose === MediaPurpose.SERVICE_IMAGE) {
      folder = 'services/images/';
    } else if (purpose === MediaPurpose.PAYMENT_PROOF) {
      folder = 'payments/proofs/';
    } else if (purpose === MediaPurpose.APPROVAL_EVIDENCE) {
      folder = 'approvals/evidence/';
    }

    const { objectKey } = await this.storage.uploadObject(
      folder,
      validated.buffer,
      `image.${validated.extension}`,
      validated.mimeType,
    );

    const asset = await this.prisma.mediaAsset.create({
      data: {
        businessId,
        objectKey,
        bucket: this.storage.getBucketName(),
        mimeType: validated.mimeType,
        fileSize: validated.size,
        purpose,
        createdByUserId: userId || null,
      },
    });

    const url = await this.storage.getPresignedDownloadUrl(objectKey);

    return {
      id: asset.id,
      businessId: asset.businessId,
      objectKey: asset.objectKey,
      bucket: asset.bucket,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      purpose: asset.purpose,
      url,
      createdAt: asset.createdAt,
    };
  }

  async findAllMedia(purpose?: MediaPurpose) {
    const businessId = await this.getBusinessId();
    const assets = await this.prisma.mediaAsset.findMany({
      where: {
        businessId,
        ...(purpose ? { purpose } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      assets.map(async (a) => {
        const url = await this.storage.getPresignedDownloadUrl(a.objectKey);
        return {
          id: a.id,
          businessId: a.businessId,
          objectKey: a.objectKey,
          bucket: a.bucket,
          mimeType: a.mimeType,
          fileSize: a.fileSize,
          purpose: a.purpose,
          url,
          createdAt: a.createdAt,
        };
      }),
    );
  }

  async findMediaById(id: string) {
    const businessId = await this.getBusinessId();
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, businessId },
    });

    if (!asset) {
      throw new NotFoundException(`Media asset dengan ID ${id} tidak ditemukan.`);
    }

    const url = await this.storage.getPresignedDownloadUrl(asset.objectKey);

    return {
      id: asset.id,
      businessId: asset.businessId,
      objectKey: asset.objectKey,
      bucket: asset.bucket,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      purpose: asset.purpose,
      url,
      createdAt: asset.createdAt,
    };
  }

  async deleteMedia(id: string) {
    const businessId = await this.getBusinessId();
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, businessId },
    });

    if (!asset) {
      throw new NotFoundException(`Media asset dengan ID ${id} tidak ditemukan.`);
    }

    // Check if used in gallery
    const galleryCount = await this.prisma.businessGallery.count({
      where: { mediaAssetId: asset.id },
    });
    if (galleryCount > 0) {
      throw new BadRequestException('Media asset masih digunakan dalam item galeri bisnis.');
    }

    // Delete from MinIO first
    await this.storage.deleteObject(asset.objectKey);

    // Delete record
    await this.prisma.mediaAsset.delete({
      where: { id: asset.id },
    });

    return { message: 'Media asset berhasil dihapus.' };
  }

  // Gallery methods
  async findAllGallery() {
    const businessId = await this.getBusinessId();
    const items = await this.prisma.businessGallery.findMany({
      where: { businessId },
      include: { mediaAsset: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return Promise.all(
      items.map(async (item) => {
        const url = await this.storage.getPresignedDownloadUrl(item.mediaAsset.objectKey);
        return {
          id: item.id,
          businessId: item.businessId,
          mediaAssetId: item.mediaAssetId,
          caption: item.caption,
          altText: item.altText,
          displayOrder: item.displayOrder,
          isActive: item.isActive,
          url,
          mediaAsset: {
            id: item.mediaAsset.id,
            mimeType: item.mediaAsset.mimeType,
            fileSize: item.mediaAsset.fileSize,
            purpose: item.mediaAsset.purpose,
            url,
          },
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      }),
    );
  }

  async createGalleryItem(dto: CreateGalleryItemDto) {
    const businessId = await this.getBusinessId();

    const media = await this.prisma.mediaAsset.findFirst({
      where: { id: dto.mediaAssetId, businessId },
    });
    if (!media) {
      throw new NotFoundException('Media asset tidak ditemukan.');
    }

    const created = await this.prisma.businessGallery.create({
      data: {
        businessId,
        mediaAssetId: dto.mediaAssetId,
        caption: dto.caption,
        altText: dto.altText,
        displayOrder: dto.displayOrder !== undefined ? dto.displayOrder : 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: { mediaAsset: true },
    });

    const url = await this.storage.getPresignedDownloadUrl(created.mediaAsset.objectKey);

    return {
      id: created.id,
      businessId: created.businessId,
      mediaAssetId: created.mediaAssetId,
      caption: created.caption,
      altText: created.altText,
      displayOrder: created.displayOrder,
      isActive: created.isActive,
      url,
      mediaAsset: {
        id: created.mediaAsset.id,
        mimeType: created.mediaAsset.mimeType,
        fileSize: created.mediaAsset.fileSize,
        purpose: created.mediaAsset.purpose,
        url,
      },
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updateGalleryItem(id: string, dto: UpdateGalleryItemDto) {
    const businessId = await this.getBusinessId();
    const item = await this.prisma.businessGallery.findFirst({
      where: { id, businessId },
    });
    if (!item) {
      throw new NotFoundException(`Item galeri dengan ID ${id} tidak ditemukan.`);
    }

    if (dto.mediaAssetId && dto.mediaAssetId !== item.mediaAssetId) {
      const media = await this.prisma.mediaAsset.findFirst({
        where: { id: dto.mediaAssetId, businessId },
      });
      if (!media) {
        throw new NotFoundException('Media asset tidak ditemukan.');
      }
    }

    const updated = await this.prisma.businessGallery.update({
      where: { id: item.id },
      data: {
        mediaAssetId: dto.mediaAssetId !== undefined ? dto.mediaAssetId : item.mediaAssetId,
        caption: dto.caption !== undefined ? dto.caption : item.caption,
        altText: dto.altText !== undefined ? dto.altText : item.altText,
        displayOrder: dto.displayOrder !== undefined ? dto.displayOrder : item.displayOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : item.isActive,
      },
      include: { mediaAsset: true },
    });

    const url = await this.storage.getPresignedDownloadUrl(updated.mediaAsset.objectKey);

    return {
      id: updated.id,
      businessId: updated.businessId,
      mediaAssetId: updated.mediaAssetId,
      caption: updated.caption,
      altText: updated.altText,
      displayOrder: updated.displayOrder,
      isActive: updated.isActive,
      url,
      mediaAsset: {
        id: updated.mediaAsset.id,
        mimeType: updated.mediaAsset.mimeType,
        fileSize: updated.mediaAsset.fileSize,
        purpose: updated.mediaAsset.purpose,
        url,
      },
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteGalleryItem(id: string) {
    const businessId = await this.getBusinessId();
    const item = await this.prisma.businessGallery.findFirst({
      where: { id, businessId },
    });
    if (!item) {
      throw new NotFoundException(`Item galeri dengan ID ${id} tidak ditemukan.`);
    }

    await this.prisma.businessGallery.delete({
      where: { id: item.id },
    });

    return { message: 'Item galeri berhasil dihapus.' };
  }

  // Public secure access verification
  async getPublicMedia(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        galleryItems: {
          where: { isActive: true },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Media tidak ditemukan.');
    }

    // Verify public approval:
    // 1. Is it a business logo for an active business?
    const isLogo = await this.prisma.business.findFirst({
      where: { logoObjectKey: asset.objectKey, isActive: true },
    });

    // 2. Is it a service image for an active service?
    const isServiceImg = await this.prisma.service.findFirst({
      where: { imageObjectKey: asset.objectKey, isActive: true },
    });

    // 3. Is it in an active gallery item?
    const isGallery = asset.galleryItems.length > 0;

    if (!isLogo && !isServiceImg && !isGallery) {
      throw new ForbiddenException('Media ini tidak bersifat publik.');
    }

    const stream = await this.storage.getObjectStream(asset.objectKey);
    const presignedUrl = await this.storage.getPresignedDownloadUrl(asset.objectKey);

    return {
      asset,
      stream,
      presignedUrl,
    };
  }
}
