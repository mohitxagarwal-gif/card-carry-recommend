import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLogout, clearUserDataFromStorage } from '../sessionManager';
import { supabase } from '@/integrations/supabase/client';

describe('sessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('handleLogout', () => {
    it('should preserve UI preferences but clear sensitive data', async () => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('hide_outlink_modal', 'true');
      localStorage.setItem('last_analysis_user123', JSON.stringify({ id: 'test' }));
      localStorage.setItem('offline_queue', JSON.stringify([{ action: 'test' }]));

      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      await handleLogout();

      expect(localStorage.getItem('theme')).toBe('dark');
      expect(localStorage.getItem('hide_outlink_modal')).toBe('true');
      expect(localStorage.getItem('last_analysis_user123')).toBeNull();
      expect(localStorage.getItem('offline_queue')).toBeNull();
    });
  });

  describe('clearUserDataFromStorage', () => {
    it('should clear all user-specific keys matching patterns', () => {
      localStorage.setItem('last_analysis_abc123', 'data');
      localStorage.setItem('last_analysis_xyz789', 'data');
      localStorage.setItem('analysis_cache_123', 'data');
      localStorage.setItem('user_preferences_cache', 'data');
      localStorage.setItem('theme', 'dark');

      clearUserDataFromStorage();

      expect(localStorage.getItem('last_analysis_abc123')).toBeNull();
      expect(localStorage.getItem('last_analysis_xyz789')).toBeNull();
      expect(localStorage.getItem('analysis_cache_123')).toBeNull();
      expect(localStorage.getItem('user_preferences_cache')).toBeNull();
      expect(localStorage.getItem('theme')).toBe('dark');
    });
  });
});
