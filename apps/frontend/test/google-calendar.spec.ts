import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GoogleCalendarConnectionSchema,
  SelectCalendarSchema,
  ResolveConflictSchema,
  GoogleSyncJobsQuerySchema,
  GoogleConflictsQuerySchema,
} from '@tampilkit-ac/api-contract';

describe('Frontend Google Calendar Integration Test Suite (Phase 10)', () => {
  it('should validate GoogleCalendarConnectionSchema for connected state', () => {
    const valid = GoogleCalendarConnectionSchema.parse({
      status: 'CONNECTED',
      googleAccountEmail: 'coolcare.ops@gmail.com',
      calendarId: 'primary',
      calendarName: 'CoolCare Operasional AC',
      calendarTimezone: 'Asia/Jakarta',
      lastSuccessfulSyncAt: new Date().toISOString(),
      watchChannelActive: true,
    });

    assert.equal(valid.status, 'CONNECTED');
    assert.equal(valid.googleAccountEmail, 'coolcare.ops@gmail.com');
    assert.equal(valid.watchChannelActive, true);
  });

  it('should validate GoogleCalendarConnectionSchema for disconnected state', () => {
    const valid = GoogleCalendarConnectionSchema.parse({
      status: 'DISCONNECTED',
      googleAccountEmail: null,
      calendarId: null,
    });

    assert.equal(valid.status, 'DISCONNECTED');
    assert.equal(valid.calendarId, null);
  });

  it('should validate SelectCalendarSchema requiring calendarId', () => {
    const valid = SelectCalendarSchema.parse({
      calendarId: 'c_18809abcdef@group.calendar.google.com',
    });
    assert.equal(valid.calendarId, 'c_18809abcdef@group.calendar.google.com');

    assert.throws(() => {
      SelectCalendarSchema.parse({ calendarId: '' });
    });
  });

  it('should validate ResolveConflictSchema for RESTORE_LOCAL action', () => {
    const valid = ResolveConflictSchema.parse({
      action: 'RESTORE_LOCAL',
      resolutionNotes: 'Pulihkan data dari database lokal ke Google',
    });
    assert.equal(valid.action, 'RESTORE_LOCAL');
    assert.equal(valid.resolutionNotes, 'Pulihkan data dari database lokal ke Google');
  });

  it('should validate ResolveConflictSchema for ACCEPT_REMOTE and IGNORE actions', () => {
    const accept = ResolveConflictSchema.parse({ action: 'ACCEPT_REMOTE' });
    assert.equal(accept.action, 'ACCEPT_REMOTE');

    const ignore = ResolveConflictSchema.parse({ action: 'IGNORE' });
    assert.equal(ignore.action, 'IGNORE');

    assert.throws(() => {
      ResolveConflictSchema.parse({ action: 'INVALID_ACTION' });
    });
  });

  it('should parse and coerce pagination parameters in GoogleSyncJobsQuerySchema', () => {
    const parsed = GoogleSyncJobsQuerySchema.parse({
      page: '2',
      limit: '15',
      status: 'FAILED_RETRY',
    });

    assert.equal(parsed.page, 2);
    assert.equal(parsed.limit, 15);
    assert.equal(parsed.status, 'FAILED_RETRY');
  });

  it('should parse GoogleConflictsQuerySchema with default values', () => {
    const parsed = GoogleConflictsQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 10);
  });
});
