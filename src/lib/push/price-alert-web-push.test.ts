/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendNotification, setVapidDetails, fromMock } = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock('web-push', () => ({
  default: {
    setVapidDetails,
    sendNotification,
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: fromMock }),
}));

import { sendPriceAlertWebPushes } from './price-alert-web-push';

describe('sendPriceAlertWebPushes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
  });

  it('returns zeros when VAPID is not configured', async () => {
    const r = await sendPriceAlertWebPushes('u1', { title: 't', body: 'b', url: '/' });
    expect(r).toEqual({ sent: 0, errors: 0 });
    expect(setVapidDetails).not.toHaveBeenCalled();
  });

  it('sends to each subscription when VAPID is set', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub';
    process.env.VAPID_PRIVATE_KEY = 'priv';
    fromMock.mockImplementation((table: string) => {
      if (table !== 'push_subscriptions') {
        return {};
      }
      return {
        select: () => ({
          eq: () =>
            Promise.resolve({
              data: [
                { id: '1', endpoint: 'https://e1/', p256dh: 'p', auth: 'a' },
                { id: '2', endpoint: 'https://e2/', p256dh: 'p2', auth: 'a2' },
              ],
              error: null,
            }),
        }),
      };
    });

    sendNotification.mockResolvedValue(undefined);
    const r = await sendPriceAlertWebPushes('u1', { title: 'Price', body: 'Hi', url: '/d' });
    expect(r).toEqual({ sent: 2, errors: 0 });
    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(setVapidDetails).toHaveBeenCalled();
  });

  it('deletes subscription on 410 from push service', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub';
    process.env.VAPID_PRIVATE_KEY = 'priv';
    const delEq = vi.fn(() => Promise.resolve({ error: null }));
    fromMock.mockImplementation((table: string) => {
      if (table !== 'push_subscriptions') {
        return {};
      }
      return {
        select: () => ({
          eq: () =>
            Promise.resolve({
              data: [{ id: 's1', endpoint: 'https://ep/', p256dh: 'p', auth: 'a' }],
              error: null,
            }),
        }),
        delete: () => ({
          eq: delEq,
        }),
      };
    });
    sendNotification.mockRejectedValue(Object.assign(new Error('gone'), { statusCode: 410 }));

    const r = await sendPriceAlertWebPushes('u1', { title: 't', body: 'b', url: '/' });
    expect(r.sent).toBe(0);
    expect(r.errors).toBe(0);
    expect(delEq).toHaveBeenCalledWith('id', 's1');
  });
});
