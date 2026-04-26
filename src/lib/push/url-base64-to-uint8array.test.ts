/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { urlBase64ToUint8Array } from './url-base64-to-uint8array';

describe('urlBase64ToUint8Array', () => {
  it('round-trips a small payload', () => {
    const original = new Uint8Array([1, 2, 3, 255]);
    const b64 = btoa(String.fromCharCode(...original)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const out = urlBase64ToUint8Array(b64);
    expect(Array.from(out)).toEqual([1, 2, 3, 255]);
  });
});
