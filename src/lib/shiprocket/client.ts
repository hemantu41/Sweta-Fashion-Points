/**
 * ShiprocketClient — authenticated HTTP client with Redis-backed token caching.
 *
 * Token lifecycle:
 *   - Shiprocket tokens are valid for 10 days.
 *   - We cache for 9 days (key: ifp:shiprocket:token) to leave a 1-day refresh window.
 *   - On a 401, the cached token is evicted and a fresh login is attempted once.
 *   - Falls back gracefully when Redis is unavailable (re-authenticates every cold start).
 */

import { redisGet, redisSetex, redisDel } from '@/lib/redis';

const BASE_URL    = 'https://apiv2.shiprocket.in/v1/external';
const TOKEN_KEY   = 'ifp:shiprocket:token';
const TOKEN_TTL   = 9 * 24 * 3600; // 9 days in seconds

interface TokenCache {
  token:     string;
  expiresAt: number; // Unix ms — belt-and-suspenders on top of Redis TTL
}

interface LoginResponse {
  token: string;
}

export class ShiprocketClient {
  private readonly email:    string;
  private readonly password: string;

  constructor() {
    this.email    = process.env.SHIPROCKET_EMAIL    ?? '';
    this.password = process.env.SHIPROCKET_PASSWORD ?? '';
  }

  // ── Token management ───────────────────────────────────────────────────────

  async getToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh) {
      const cached = await this.readCachedToken();
      if (cached) return cached;
    }

    return this.login();
  }

  private async readCachedToken(): Promise<string | null> {
    const raw = await redisGet(TOKEN_KEY);
    if (!raw) return null;

    try {
      const entry: TokenCache = JSON.parse(raw);
      // Extra safety: discard if the stored expiry has passed
      if (entry.expiresAt > Date.now()) return entry.token;
    } catch {
      // Corrupt entry — let it fall through to login
    }
    return null;
  }

  private async login(): Promise<string> {
    if (!this.email || !this.password) {
      throw new Error(
        '[Shiprocket] SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD env vars are not set',
      );
    }

    const res = await fetch(`${BASE_URL}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: this.email, password: this.password }),
      cache:   'no-store',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`[Shiprocket] Login failed (${res.status}): ${text}`);
    }

    const data: LoginResponse = await res.json();
    if (!data.token) throw new Error('[Shiprocket] Login succeeded but no token in response');

    // Persist in Redis
    const entry: TokenCache = {
      token:     data.token,
      expiresAt: Date.now() + TOKEN_TTL * 1000,
    };
    await redisSetex(TOKEN_KEY, TOKEN_TTL, JSON.stringify(entry));

    console.log('[Shiprocket] Token refreshed and cached');
    return data.token;
  }

  // ── Authenticated HTTP ─────────────────────────────────────────────────────

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path:   string,
    body?:  unknown,
  ): Promise<T> {
    return this._doRequest<T>(method, path, body, false);
  }

  private async _doRequest<T>(
    method:      'GET' | 'POST' | 'PUT' | 'DELETE',
    path:        string,
    body:        unknown,
    isRetry:     boolean,
  ): Promise<T> {
    const token = await this.getToken();

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store',
    });

    // Auto-refresh on 401 (expired token served from a stale Redis entry)
    if (res.status === 401 && !isRetry) {
      console.warn('[Shiprocket] 401 — evicting token and retrying');
      await redisDel(TOKEN_KEY);
      return this._doRequest<T>(method, path, body, true /* isRetry */);
    }

    if (!res.ok) {
      let message = res.statusText;
      try {
        const err = await res.json();
        message = err.message || err.error || JSON.stringify(err);
      } catch { /* keep statusText */ }
      throw new Error(`[Shiprocket] ${method} ${path} → ${res.status}: ${message}`);
    }

    return res.json() as Promise<T>;
  }
}

/** Singleton — one client per process, token shared via Redis across instances */
export const shiprocketClient = new ShiprocketClient();
