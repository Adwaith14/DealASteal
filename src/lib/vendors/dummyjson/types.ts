import { z } from 'zod';

/** One product object from https://dummyjson.com/docs/products (shape may grow; we only read known keys). */
export const DummyJsonProductSchema = z
  .object({
    id: z.number().int().nonnegative(),
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    price: z.number().finite().nonnegative(),
    discountPercentage: z.number().finite().nonnegative().optional(),
    thumbnail: z.string().url().optional(),
    images: z.array(z.string().url()).optional(),
    brand: z.string().optional(),
    sku: z.string().optional(),
  })
  .passthrough();

export type DummyJsonProduct = z.infer<typeof DummyJsonProductSchema>;

export const DummyJsonProductsPageSchema = z.object({
  products: z.array(DummyJsonProductSchema),
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

export type DummyJsonProductsPage = z.infer<typeof DummyJsonProductsPageSchema>;
