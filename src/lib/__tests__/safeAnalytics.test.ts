import { describe, it, expect, vi, beforeEach } from 'vitest';
import { safeTrackEvent } from '../safeAnalytics';
import { supabase } from '@/integrations/supabase/client';

describe('safeAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('safeTrackEvent', () => {
    it('should redact card numbers from event data', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      } as any);

      await safeTrackEvent('FORM_SUBMIT', {
        formData: {
          name: 'John',
          cardNumber: '4111111111111111',
          message: 'Card ending in 1234'
        }
      });

      const call = mockInsert.mock.calls[0][0];
      expect(call.event_data.formData.name).toBe('John');
      expect(call.event_data.formData.cardNumber).toBe('[REDACTED]');
      expect(call.event_data.formData.message).toBe('Card ending in [REDACTED]');
    });

    it('should redact OTP codes', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      } as any);

      await safeTrackEvent('OTP_ENTRY', {
        message: 'User entered OTP: 123456 to verify'
      });

      const call = mockInsert.mock.calls[0][0];
      expect(call.event_data.message).toContain('[REDACTED]');
      expect(call.event_data.message).not.toContain('123456');
    });

    it('should drop sensitive keys entirely', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      } as any);

      await safeTrackEvent('USER_ACTION', {
        username: 'john',
        password: 'secret123',
        api_key: 'abc',
        cvv: '123',
        normalField: 'visible'
      });

      const call = mockInsert.mock.calls[0][0];
      expect(call.event_data.password).toBe('[REDACTED]');
      expect(call.event_data.api_key).toBe('[REDACTED]');
      expect(call.event_data.cvv).toBe('[REDACTED]');
      expect(call.event_data.normalField).toBe('visible');
    });

    it('should handle arrays correctly', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      } as any);

      await safeTrackEvent('BATCH_ACTION', {
        items: [
          { name: 'Item 1', cvv: '123' },
          { name: 'Item 2', token: 'abc' }
        ]
      });

      const call = mockInsert.mock.calls[0][0];
      expect(call.event_data.items[0].cvv).toBe('[REDACTED]');
      expect(call.event_data.items[1].token).toBe('[REDACTED]');
    });

    it('should not throw when insert fails', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: new Error('DB error') })
      } as any);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      } as any);

      await expect(
        safeTrackEvent('TEST_EVENT', { data: 'test' })
      ).resolves.not.toThrow();
    });
  });
});
