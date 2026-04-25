import { describe, expect, it } from 'vitest';
import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('escapes HTML specials', () => {
    expect(escapeHtml(`a<b>"'&`)).toBe('a&lt;b&gt;&quot;&#39;&amp;');
  });
});
