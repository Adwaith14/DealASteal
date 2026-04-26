/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';
import { createLatestDealsListRuntimeCaching } from '@/lib/pwa/latest-deals-api-runtime-cache';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [createLatestDealsListRuntimeCaching(), ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener('push', (event: PushEvent) => {
  let data: { title?: string; body?: string; url?: string; tag?: string } = {};
  try {
    if (event.data) {
      data = event.data.json() as typeof data;
    }
  } catch {
    data = { body: event.data?.text() };
  }
  const title = data.title ?? 'DealASteal';
  const body = data.body ?? 'You have a new update.';
  const url = data.url ?? '/';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      tag: data.tag ?? 'dealasteal',
      icon: '/pwa/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const raw = event.notification.data as { url?: string } | undefined;
  const pathOrUrl = typeof raw?.url === 'string' ? raw.url : '/';
  const target = new URL(pathOrUrl, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const c of clientList) {
        const wc = c as WindowClient;
        if (wc.url.startsWith(self.location.origin) && typeof wc.navigate === 'function') {
          return wc.navigate(target);
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
