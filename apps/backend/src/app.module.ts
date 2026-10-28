import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { validateEnv } from './config/env.config';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessModule } from './modules/business/business.module';
import { BusinessClosuresModule } from './modules/business-closures/business-closures.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { ServicesModule } from './modules/services/services.module';
import { ServiceAreasModule } from './modules/service-areas/service-areas.module';
import { MediaModule } from './modules/media/media.module';
import { PublicModule } from './modules/public/public.module';
import { CustomerAuditModule } from './modules/customer-audit/customer-audit.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CustomerAddressesModule } from './modules/customer-addresses/customer-addresses.module';
import { AcUnitsModule } from './modules/ac-units/ac-units.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AdminBookingsModule } from './modules/admin-bookings/admin-bookings.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { TechnicianJobsModule } from './modules/technician-jobs/technician-jobs.module';
import { GoogleCalendarModule } from './modules/google-calendar/google-calendar.module';
import { BillingModule } from './modules/billing/billing.module';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    PrismaModule,
    StorageModule,
    HealthModule,
    AuthModule,
    BusinessModule,
    BusinessClosuresModule,
    ServiceCategoriesModule,
    ServicesModule,
    ServiceAreasModule,
    MediaModule,
    PublicModule,
    CustomerAuditModule,
    CustomersModule,
    CustomerAddressesModule,
    AcUnitsModule,
    AvailabilityModule,
    BookingsModule,
    AdminBookingsModule,
    WorkOrdersModule,
    AdminDashboardModule,
    TechnicianJobsModule,
    GoogleCalendarModule,
    BillingModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
