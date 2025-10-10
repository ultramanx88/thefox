#!/usr/bin/env node
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const BASE = process.env.API_BASE_URL || 'http://localhost:3000';

async function main() {
  try {
    // health
    const h = await fetch(`${BASE}/healthz`);
    console.log('healthz', h.status, await h.text());

    // register
    const email = `test_${Date.now()}@example.com`;
    const reg = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'P@ssw0rd123', displayName: 'Smoke' })
    });
    console.log('register', reg.status);

    // login
    const login = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'P@ssw0rd123' })
    });
    const loginJson = await login.json().catch(() => ({}));
    console.log('login', login.status);
    const token = loginJson.accessToken;
    if (!token) throw new Error('no token');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // me
    const me = await fetch(`${BASE}/me`, { headers: authHeaders });
    console.log('me', me.status);

    // products
    const products = await fetch(`${BASE}/products?limit=1`);
    console.log('products', products.status);

    console.log('Smoke test completed');
  } catch (e) {
    console.error('Smoke test failed', e);
    process.exit(1);
  }
}

main();


