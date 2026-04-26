'use client';

import { useCallback, useEffect, useState } from 'react';
import { urlBase64ToUint8Array } from '@/lib/push/url-base64-to-uint8array';

type Phase = 'idle' | 'loading' | 'ready' | 'unsupported' | 'done' | 'error';

export function PushNotifyOptIn() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhase('loading');
      try {
        const res = await fetch('/api/me/push-subscribe', { method: 'GET' });
        const j = (await res.json()) as { vapidPublicKey?: string | null };
        if (cancelled) return;
        if (!res.ok) {
          setPhase('error');
          setMessage('Could not check push settings.');
          return;
        }
        if (!j.vapidPublicKey) {
          setVapidKey(null);
          setPhase('ready');
          return;
        }
        setVapidKey(j.vapidPublicKey);
        setPhase('ready');
      } catch {
        if (!cancelled) {
          setPhase('error');
          setMessage('Network error.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onEnable = useCallback(async () => {
    setMessage(null);
    if (!vapidKey) {
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPhase('unsupported');
      setMessage('This browser does not support Web Push.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setMessage('Notifications were not allowed.');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const res = await fetch('/api/me/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(j.error ?? `Save failed (${res.status})`);
        return;
      }
      setPhase('done');
      setMessage('Price-drop push is on for this device.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Subscribe failed.');
    }
  }, [vapidKey]);

  if (phase === 'loading' || phase === 'idle') {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-900">Price alerts (push)</h2>
        <p className="mt-2 text-xs text-gray-600">Loading…</p>
      </section>
    );
  }

  if (!vapidKey) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-900">Price alerts (push)</h2>
        <p className="mt-2 text-xs text-gray-600">
          Browser push is not configured on this deployment. Email alerts still work when enabled on a deal.
        </p>
      </section>
    );
  }

  if (process.env.NODE_ENV === 'development') {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-900">Price alerts (push)</h2>
        <p className="mt-2 text-xs text-gray-600">
          Service workers are off in local dev. Use a preview/production build to register push on this device.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-900">Price alerts (push)</h2>
      <p className="mt-2 text-xs leading-relaxed text-gray-600">
        Get a device notification when a saved price target is hit (in addition to email, when both are available).
      </p>
      {phase === 'done' ? (
        <p className="mt-3 text-xs font-semibold text-green-800">{message}</p>
      ) : (
        <button
          type="button"
          onClick={() => void onEnable()}
          className="mt-3 rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
        >
          Enable push on this device
        </button>
      )}
      {message && phase !== 'done' ? <p className="mt-2 text-xs font-medium text-red-800">{message}</p> : null}
    </section>
  );
}
