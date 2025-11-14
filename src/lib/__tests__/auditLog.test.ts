import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAuditEvent, logAuditEvents } from '../auditLog';
import { supabase } from '@/integrations/supabase/client';

describe('auditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAuditEvent', () => {
    it('should sanitize sensitive metadata before logging', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      } as any);

      await logAuditEvent('TEST_EVENT', {
        metadata: {
          username: 'john',
          password: 'secret123',
          cvv: '123',
          card_number: '4111111111111111',
          normalField: 'visible'
        }
      });

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        actor: 'user',
        event_type: 'TEST_EVENT',
        event_category: undefined,
        severity: 'info',
        metadata: {
          username: 'john',
          password: '[REDACTED]',
          cvv: '[REDACTED]',
          card_number: '[REDACTED]',
          normalField: 'visible'
        },
        request_id: undefined
      });
    });

    it('should handle nested objects in metadata', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      } as any);

      await logAuditEvent('TEST_EVENT', {
        metadata: {
          user: {
            name: 'John',
            token: 'abc123',
            preferences: {
              theme: 'dark',
              api_key: 'secret'
            }
          }
        }
      });

      const call = mockInsert.mock.calls[0][0];
      expect(call.metadata.user.name).toBe('John');
      expect(call.metadata.user.token).toBe('[REDACTED]');
      expect(call.metadata.user.preferences.theme).toBe('dark');
      expect(call.metadata.user.preferences.api_key).toBe('[REDACTED]');
    });

    it('should not throw when Supabase insert fails', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: new Error('DB error') })
      } as any);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      } as any);

      await expect(
        logAuditEvent('TEST_EVENT', { metadata: { test: 'data' } })
      ).resolves.not.toThrow();
    });
  });

  describe('logAuditEvents (batch)', () => {
    it('should sanitize all events in batch', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      } as any);

      await logAuditEvents([
        {
          eventType: 'EVENT1',
          metadata: { password: 'secret' }
        },
        {
          eventType: 'EVENT2',
          metadata: { otp: '123456' }
        }
      ]);

      const entries = mockInsert.mock.calls[0][0];
      expect(entries).toHaveLength(2);
      expect(entries[0].metadata.password).toBe('[REDACTED]');
      expect(entries[1].metadata.otp).toBe('[REDACTED]');
    });
  });
});
