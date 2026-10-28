import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GoogleConflictController } from './controllers/google-conflict.controller';
import { GoogleOAuthController } from './controllers/google-oauth.controller';
import { GoogleSyncController } from './controllers/google-sync.controller';
import { GoogleWebhookController } from './controllers/google-webhook.controller';
import { CalendarConflictService } from './services/calendar-conflict.service';
import { CalendarSyncService } from './services/calendar-sync.service';
import { CalendarWatchService } from './services/calendar-watch.service';
import { GoogleCalendarClientService } from './services/google-calendar-client.service';
import { GoogleEventService } from './services/google-event.service';
import { GoogleFreeBusyService } from './services/google-freebusy.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { GoogleTokenService } from './services/google-token.service';
import { CalendarJobProcessor } from './workers/calendar-job-processor';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [
    GoogleOAuthController,
    GoogleSyncController,
    GoogleConflictController,
    GoogleWebhookController,
  ],
  providers: [
    GoogleTokenService,
    GoogleOAuthService,
    GoogleCalendarClientService,
    GoogleEventService,
    GoogleFreeBusyService,
    CalendarSyncService,
    CalendarWatchService,
    CalendarConflictService,
    CalendarJobProcessor,
  ],
  exports: [
    GoogleTokenService,
    GoogleOAuthService,
    GoogleCalendarClientService,
    GoogleEventService,
    GoogleFreeBusyService,
    CalendarSyncService,
    CalendarWatchService,
    CalendarConflictService,
    CalendarJobProcessor,
  ],
})
export class GoogleCalendarModule {}
