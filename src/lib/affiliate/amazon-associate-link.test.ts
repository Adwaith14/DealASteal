import { afterEach, describe, expect, it, vi } from 'vitest';
import { readAmazonAssociateTagFromEnv, withAmazonAssociateTag } from './amazon-associate-link';

describe('withAmazonAssociateTag', () => {
  it('adds tag to amazon.com URLs when missing', () => {
    expect(
      withAmazonAssociateTag('https://www.amazon.com/dp/B0TEST1234', 'mysite-20')
    ).toBe('https://www.amazon.com/dp/B0TEST1234?tag=mysite-20');
  });

  it('does not duplicate an existing tag', () => {
    expect(
      withAmazonAssociateTag(
        'https://www.amazon.com/dp/B0TEST1234?tag=already-20',
        'mysite-20'
      )
    ).toBe('https://www.amazon.com/dp/B0TEST1234?tag=already-20');
  });

  it('leaves non-Amazon URLs unchanged', () => {
    expect(withAmazonAssociateTag('https://walmart.com/ip/1', 'mysite-20')).toBe(
      'https://walmart.com/ip/1'
    );
  });
});

describe('readAmazonAssociateTagFromEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers NEXT_PUBLIC then server-only env', () => {
    vi.stubEnv('NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG', 'pub-20');
    vi.stubEnv('AMAZON_ASSOCIATE_TAG', 'srv-20');
    expect(readAmazonAssociateTagFromEnv()).toBe('pub-20');
  });

  it('falls back to AM when public unset', () => {
    vi.stubEnv('NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG', '');
    vi.stubEnv('AMAZON_ASSOCIATE_TAG', 'srv-20');
    expect(readAmazonAssociateTagFromEnv()).toBe('srv-20');
  });
});
