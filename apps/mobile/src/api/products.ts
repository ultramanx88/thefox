import type { Product } from '@thefox/shared';
import { API_URL } from '../config';

function isProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const product = value as Record<string, unknown>;

  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.price === 'number' &&
    typeof product.unit === 'string' &&
    typeof product.category === 'string' &&
    typeof product.imageUrl === 'string' &&
    typeof product.vendorId === 'string' &&
    typeof product.stock === 'number' &&
    typeof product.description === 'string'
  );
}

function parseProducts(payload: unknown): Product[] {
  if (!Array.isArray(payload) || !payload.every(isProduct)) {
    throw new Error('Product response does not match the API contract');
  }

  return payload;
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  const response = await fetch(`${API_URL}/v1/products`, { signal });

  if (!response.ok) {
    throw new Error(`Product request failed with status ${response.status}`);
  }

  const payload: unknown = await response.json();
  const data =
    typeof payload === 'object' && payload !== null && 'data' in payload
      ? payload.data
      : payload;

  return parseProducts(data);
}
