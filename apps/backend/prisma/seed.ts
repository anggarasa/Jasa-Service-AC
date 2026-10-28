import { PrismaClient, PriceType, PricingUnit, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Menjalankan seed data Phase 03 untuk TampilKit AC Booking...');

  // 1. Seed Business (CoolCare AC Service)
  const business = await prisma.business.upsert({
    where: { slug: 'coolcare-ac' },
    update: {
      name: 'CoolCare AC Service',
      description: 'Layanan spesialis cuci, perawatan berkala, perbaikan, dan instalasi AC profesional di Jabodetabek.',
      email: 'halo@coolcare.id',
      phone: '+62 812-3456-7890',
      whatsappNumber: '6281234567890',
      address: 'Jl. Merdeka No. 45',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12160',
      googleMapsUrl: 'https://maps.google.com/?q=-6.2088,106.8456',
      timezone: 'Asia/Jakarta',
      isActive: true,
    },
    create: {
      name: 'CoolCare AC Service',
      slug: 'coolcare-ac',
      description: 'Layanan spesialis cuci, perawatan berkala, perbaikan, dan instalasi AC profesional di Jabodetabek.',
      email: 'halo@coolcare.id',
      phone: '+62 812-3456-7890',
      whatsappNumber: '6281234567890',
      address: 'Jl. Merdeka No. 45',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12160',
      googleMapsUrl: 'https://maps.google.com/?q=-6.2088,106.8456',
      timezone: 'Asia/Jakarta',
      isActive: true,
    },
  });

  console.log(`✅ Business terdaftar: ${business.name} (${business.id})`);

  // 2. Seed Business Settings (Phase 03)
  await prisma.businessSetting.upsert({
    where: { businessId: business.id },
    update: {
      bookingEnabled: true,
      bookingIntervalMinutes: 30,
      defaultServiceBufferMinutes: 15,
      defaultTravelBufferMinutes: 30,
      minimumAdvanceMinutes: 120,
      maximumAdvanceDays: 30,
      autoConfirmBooking: false,
      allowCustomerCancellation: false,
      cancellationWindowHours: 24,
      maximumUnitsPerBooking: 5,
      currency: 'IDR',
    },
    create: {
      businessId: business.id,
      bookingEnabled: true,
      bookingIntervalMinutes: 30,
      defaultServiceBufferMinutes: 15,
      defaultTravelBufferMinutes: 30,
      minimumAdvanceMinutes: 120,
      maximumAdvanceDays: 30,
      autoConfirmBooking: false,
      allowCustomerCancellation: false,
      cancellationWindowHours: 24,
      maximumUnitsPerBooking: 5,
      currency: 'IDR',
    },
  });

  // 3. Seed Operating Hours (0 = Minggu s/d 6 = Sabtu)
  const operatingHoursConfig = [
    { day: 0, isOpen: false, open: '09:00', close: '17:00', breaks: [] },
    { day: 1, isOpen: true, open: '09:00', close: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
    { day: 2, isOpen: true, open: '09:00', close: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
    { day: 3, isOpen: true, open: '09:00', close: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
    { day: 4, isOpen: true, open: '09:00', close: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
    { day: 5, isOpen: true, open: '09:00', close: '17:00', breaks: [{ start: '11:30', end: '13:00' }] },
    { day: 6, isOpen: true, open: '09:00', close: '15:00', breaks: [] },
  ];

  for (const oh of operatingHoursConfig) {
    const record = await prisma.businessOperatingHour.upsert({
      where: {
        businessId_dayOfWeek: {
          businessId: business.id,
          dayOfWeek: oh.day,
        },
      },
      update: {
        isOpen: oh.isOpen,
        openTime: oh.open,
        closeTime: oh.close,
      },
      create: {
        businessId: business.id,
        dayOfWeek: oh.day,
        isOpen: oh.isOpen,
        openTime: oh.open,
        closeTime: oh.close,
      },
    });

    // Replace breaks
    await prisma.businessOperatingBreak.deleteMany({
      where: { operatingHourId: record.id },
    });

    for (const b of oh.breaks) {
      await prisma.businessOperatingBreak.create({
        data: {
          operatingHourId: record.id,
          startTime: b.start,
          endTime: b.end,
        },
      });
    }
  }

  console.log('✅ Jam Operasional & Istirahat Mingguan terkonfigurasi');

  // 4. Seed Service Categories
  const categoriesData = [
    { name: 'Cuci AC (Cleaning)', slug: 'cuci-ac', description: 'Pembersihan unit AC indoor dan outdoor bertekanan tinggi.', displayOrder: 1 },
    { name: 'Perawatan & Freon', slug: 'perawatan-ac', description: 'Pemeriksaan tekanan sirkulasi pendingin dan isi freon.', displayOrder: 2 },
    { name: 'Perbaikan AC (Repair)', slug: 'perbaikan-ac', description: 'Diagnosa teknis dan penggantian suku cadang bermasalah.', displayOrder: 3 },
    { name: 'Bongkar Pasang (Installation)', slug: 'pasang-ac', description: 'Instalasi unit baru, pemindahan pipa, dan uji vakum.', displayOrder: 4 },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const category = await prisma.serviceCategory.upsert({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: cat.slug,
        },
      },
      update: {
        name: cat.name,
        description: cat.description,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
      create: {
        businessId: business.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug, category.id);
  }

  // 5. Seed Services (Phase 03 requirements)
  const servicesData = [
    {
      categorySlug: 'cuci-ac',
      name: 'Cuci AC Split Standar',
      slug: 'cuci-ac-standar',
      shortDescription: 'Cuci rutin indoor & outdoor',
      description: 'Pembersihan evaporator, filter udara, blower indoor, dan condensor unit outdoor menggunakan jet pump bertekanan.',
      priceType: PriceType.FIXED,
      basePrice: 75000,
      pricingUnit: PricingUnit.PER_UNIT,
      estimatedDurationMinutes: 60,
      additionalBufferMinutes: 15,
      minimumUnits: 1,
      maximumUnits: 10,
      displayOrder: 1,
    },
    {
      categorySlug: 'perawatan-ac',
      name: 'Isi & Tambah Freon',
      slug: 'isi-tambah-freon',
      shortDescription: 'Pengisian freon R32 / R410A / R22',
      description: 'Pengecekan kebocoran nepel dan penambahan freon ramah lingkungan sesuai tekanan standar kompresor.',
      priceType: PriceType.STARTING_FROM,
      basePrice: 150000,
      pricingUnit: PricingUnit.PER_UNIT,
      estimatedDurationMinutes: 60,
      additionalBufferMinutes: 15,
      minimumUnits: 1,
      maximumUnits: 8,
      displayOrder: 2,
    },
    {
      categorySlug: 'perbaikan-ac',
      name: 'Inspeksi & Perbaikan AC',
      slug: 'pemeriksaan-perbaikan-ac',
      shortDescription: 'Diagnosa teknisi di lokasi',
      description: 'Pengecekan komponen elektrikal, kapasitor, PCB, sensor suhu, atau kebocoran air. Biaya perbaikan disepakati setelah inspeksi.',
      priceType: PriceType.INSPECTION_REQUIRED,
      basePrice: null,
      pricingUnit: PricingUnit.INSPECTION,
      estimatedDurationMinutes: 90,
      additionalBufferMinutes: 20,
      minimumUnits: 1,
      maximumUnits: 5,
      displayOrder: 3,
    },
    {
      categorySlug: 'pasang-ac',
      name: 'Bongkar Pasang AC',
      slug: 'bongkar-pasang-ac',
      shortDescription: 'Instalasi lengkap bergaransi',
      description: 'Pemasangan bracket outdoor, sambungan pipa tembaga, kabel power, isolasi drainase, serta pengujian vakum pipa.',
      priceType: PriceType.STARTING_FROM,
      basePrice: 350000,
      pricingUnit: PricingUnit.PER_UNIT,
      estimatedDurationMinutes: 180,
      additionalBufferMinutes: 30,
      minimumUnits: 1,
      maximumUnits: 4,
      displayOrder: 4,
    },
  ];

  for (const s of servicesData) {
    const categoryId = categoryMap.get(s.categorySlug);
    if (!categoryId) continue;

    await prisma.service.upsert({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: s.slug,
        },
      },
      update: {
        categoryId,
        name: s.name,
        shortDescription: s.shortDescription,
        description: s.description,
        priceType: s.priceType,
        basePrice: s.basePrice,
        pricingUnit: s.pricingUnit,
        estimatedDurationMinutes: s.estimatedDurationMinutes,
        additionalBufferMinutes: s.additionalBufferMinutes,
        minimumUnits: s.minimumUnits,
        maximumUnits: s.maximumUnits,
        displayOrder: s.displayOrder,
        isActive: true,
      },
      create: {
        businessId: business.id,
        categoryId,
        name: s.name,
        slug: s.slug,
        shortDescription: s.shortDescription,
        description: s.description,
        priceType: s.priceType,
        basePrice: s.basePrice,
        pricingUnit: s.pricingUnit,
        estimatedDurationMinutes: s.estimatedDurationMinutes,
        additionalBufferMinutes: s.additionalBufferMinutes,
        minimumUnits: s.minimumUnits,
        maximumUnits: s.maximumUnits,
        displayOrder: s.displayOrder,
        isActive: true,
      },
    });
  }

  // 6. Seed Service Areas (Demonstration data)
  const serviceAreas = [
    { name: 'Jakarta Selatan (Kebayoran & Sekitarnya)', province: 'DKI Jakarta', city: 'Jakarta Selatan', district: 'Kebayoran Baru', visitFee: 0, travelMinutes: 20, displayOrder: 1 },
    { name: 'Kota Depok (Cinere & Beji)', province: 'Jawa Barat', city: 'Kota Depok', district: 'Cinere', visitFee: 20000, travelMinutes: 35, displayOrder: 2 },
    { name: 'Kota Bogor (Bogor Selatan)', province: 'Jawa Barat', city: 'Kota Bogor', district: 'Bogor Selatan', visitFee: 35000, travelMinutes: 50, displayOrder: 3 },
  ];

  for (const area of serviceAreas) {
    await prisma.serviceArea.upsert({
      where: {
        businessId_name: {
          businessId: business.id,
          name: area.name,
        },
      },
      update: {
        province: area.province,
        city: area.city,
        district: area.district,
        visitFee: area.visitFee,
        estimatedTravelMinutes: area.travelMinutes,
        displayOrder: area.displayOrder,
        isActive: true,
      },
      create: {
        businessId: business.id,
        name: area.name,
        province: area.province,
        city: area.city,
        district: area.district,
        visitFee: area.visitFee,
        estimatedTravelMinutes: area.travelMinutes,
        displayOrder: area.displayOrder,
        isActive: true,
      },
    });
  }

  console.log('✅ Area Layanan demo terkonfigurasi');
  console.log('✨ Seed Phase 03 selesai dan idempoten!');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
