import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn()
  }
}));

beforeAll(() => {
  console.log('Starting test suite');
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  console.log('Test suite complete');
});
