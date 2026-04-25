import { describe, expect, it } from 'vitest';
import { safeRelativePath } from './safe-redirect';

describe('safeRelativePath', () => {
  it('accepts plain in-app paths', () => {
    expect(safeRelativePath('/account')).toBe('/account');
    expect(safeRelativePath('/deals/abc?x=1#h')).toBe('/deals/abc?x=1#h');
  });

  it('rejects empty / non-string input', () => {
    expect(safeRelativePath(null)).toBe('/');
    expect(safeRelativePath(undefined)).toBe('/');
    expect(safeRelativePath('')).toBe('/');
    expect(safeRelativePath('   ')).toBe('/');
  });

  it('rejects protocol-relative URLs', () => {
    expect(safeRelativePath('//evil.com/login')).toBe('/');
    expect(safeRelativePath('//evil.com')).toBe('/');
  });

  it('rejects backslash tricks', () => {
    expect(safeRelativePath('/\\evil.com')).toBe('/');
    expect(safeRelativePath('/path\\with\\backslash')).toBe('/');
  });

  it('rejects javascript:, data:, mailto: schemes', () => {
    expect(safeRelativePath('javascript:alert(1)')).toBe('/');
    expect(safeRelativePath('/javascript:alert(1)')).toBe('/');
    expect(safeRelativePath('data:text/html,<script>1</script>')).toBe('/');
    expect(safeRelativePath('mailto:a@b.com')).toBe('/');
  });

  it('honors a custom fallback', () => {
    expect(safeRelativePath('//evil.com', '/login')).toBe('/login');
    expect(safeRelativePath(null, '/login')).toBe('/login');
  });
});
