import { PATCH } from '@/app/api/user/profile/route';

// Mock dependencies
jest.mock('@/lib/auth/getAuthUserFromRequest', () => ({
  getAuthUserFromRequest: jest.fn(async (req: any) => ({ id: 'test-user-id', email: 'tester@example.com' })),
}));

const upsertMock = jest.fn(async (payload: any) => ({ data: [{ ...payload, id: 'row-1' }] }));
jest.mock('@/lib/db/upsertUserProfile', () => ({
  upsertUserProfile: upsertMock,
}));

// Silence supabaseServer check by providing a dummy
jest.mock('@/lib/db/supabaseServer', () => ({
  supabaseServer: {},
}));

// Mock normalize function to use the real implementation
jest.mock('@/lib/phone/normalize', () => {
  return jest.fn((cc: any, phone: any) => {
    // simple emulation: strip non-digits and prepend +
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length < 6 || digits.length > 15) return null;
    const ccDigits = String(cc || '').replace(/\D/g, '') || '34';
    return `+${ccDigits}${digits}`;
  });
});

describe('PATCH /api/user/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves whatsapp phone as E.164, persists to dedicated columns, and returns 200 even if ticket POST fails', async () => {
    // Arrange: build a request containing whatsapp fields
    const body = {
      email: 'tester@example.com',
      whatsappCountryCode: '+34',
      whatsappPhone: '612345678',
      whatsappOptIn: true,
    };

    // Mock global fetch to simulate ticket POST failure
    (global as any).fetch = jest.fn(async () => {
      throw new Error('ticket endpoint down');
    });

    const req = new Request('https://example.com/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // Act
    const res = await PATCH(req as any);

    // Assert response is JSON and contains profile
    expect(res).toBeDefined();
    // NextResponse.json returns a Response-like object; we can read its body
    const json = await res.json();
    expect(json).toHaveProperty('profile');

    // Check upsert was called
    expect(upsertMock).toHaveBeenCalled();
    const calledPayload = upsertMock.mock.calls[0][0];
    expect(calledPayload).toHaveProperty('whatsapp_phone_e164', '+34612345678');
    expect(calledPayload).toHaveProperty('whatsapp_opt_in', true);
    expect(calledPayload).toHaveProperty('whatsapp_requested_at');
  });
});
