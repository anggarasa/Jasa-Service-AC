import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { InvoicesController } from './controllers/invoices.controller';
import { PaymentsController } from './controllers/payments.controller';
import { PricingController } from './controllers/pricing.controller';
import { PublicBillingController } from './controllers/public-billing.controller';
import { ReportsController } from './controllers/reports.controller';
import { TechnicianBillingController } from './controllers/technician-billing.controller';
import { CsvExportService } from './services/csv-export.service';
import { InvoiceService } from './services/invoice.service';
import { PaymentService } from './services/payment.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { PricingService } from './services/pricing.service';
import { ReportsService } from './services/reports.service';

@Module({
  imports: [PrismaModule, StorageModule, AuthModule],
  controllers: [
    PricingController,
    InvoicesController,
    PaymentsController,
    ReportsController,
    PublicBillingController,
    TechnicianBillingController,
  ],
  providers: [
    PricingService,
    InvoiceService,
    PaymentService,
    ReportsService,
    CsvExportService,
    PdfGeneratorService,
  ],
  exports: [
    PricingService,
    InvoiceService,
    PaymentService,
    ReportsService,
    CsvExportService,
    PdfGeneratorService,
  ],
})
export class BillingModule {}
