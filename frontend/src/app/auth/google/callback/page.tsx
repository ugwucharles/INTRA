'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const exchangeStatusByCode = new Map<string, 'pending' | 'done'>();
type GoogleExchangeResponse = {
  access_token?: string;
  token?: string;
  user?: unknown;
};

export default function GoogleCallbackPage() {
  const router = useRouter();
  const hasExchanged = useRef(false);

  useEffect(() => {
    if (hasExchanged.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const token = params.get('token');
    const existingToken = localStorage.getItem('token');
    const hardNavigateToDashboard = () => {
      // Full page navigation remounts AuthProvider so it can read token and fetch /auth/me.
      window.location.replace('/dashboard');
    };
    const validateTokenAndNavigate = async (jwt: string) => {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://api.intrabox.com.ng'
          : 'http://localhost:3000');
      const meUrl = `${apiUrl.replace(/\/$/, '')}/auth/me?_t=${Date.now()}`;
      const meResponse = await fetch(meUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        cache: 'no-store',
      });
      if (!meResponse.ok) {
        throw new Error(`Token validation failed (${meResponse.status})`);
      }
      hardNavigateToDashboard();
    };

    if (token) {
      localStorage.setItem('token', token);
      validateTokenAndNavigate(token)
        .catch((err) => {
          console.error('[Google Auth] Token from callback is invalid:', err);
          localStorage.removeItem('token');
          router.replace('/login');
        });
      return;
    }

    if (existingToken && !code) {
      validateTokenAndNavigate(existingToken)
        .catch((err) => {
          console.error('[Google Auth] Existing token is invalid:', err);
          localStorage.removeItem('token');
          router.replace('/login');
        });
      return;
    }

    if (!code) {
      router.replace('/login');
      return;
    }

    const codeStatus = exchangeStatusByCode.get(code);
    if (codeStatus === 'pending') {
      // Another effect run is already exchanging this code (e.g., React Strict Mode dev remount).
      return;
    }
    if (codeStatus === 'done') {
      if (localStorage.getItem('token')) {
        hardNavigateToDashboard();
      } else {
        router.replace('/login');
      }
      return;
    }

    hasExchanged.current = true;
    exchangeStatusByCode.set(code, 'pending');

    // Clear any stale token BEFORE the exchange so a failure can never
    // fall back to an old (possibly expired) JWT and cause a
    // "dashboard → login" flash.
    localStorage.removeItem('token');

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://api.intrabox.com.ng'
        : 'http://localhost:3000');
    const exchangeUrl = `${apiUrl.replace(/\/$/, '')}/auth/google/exchange`;
    console.log(`[Google Auth] Attempting code exchange at: ${exchangeUrl}`);
    console.log(`[Google Auth] With code: ${code.substring(0, 8)}...`);

    fetch(exchangeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })
      .then(async (res): Promise<GoogleExchangeResponse> => {
        if (!res.ok) {
          const text = await res.text().catch(() => 'No text provided');
          console.error(
            `[Google Auth] Exchange failed with status ${res.status}:`,
            text,
          );
          throw new Error(`Code exchange failed (${res.status}): ${text}`);
        }
        return (await res.json()) as GoogleExchangeResponse;
      })
      .then((data: GoogleExchangeResponse) => {
        const tokenFromExchange = data.access_token ?? data.token;
        if (tokenFromExchange) {
          console.log('[Google Auth] Exchange succeeded, storing token');
          localStorage.setItem('token', tokenFromExchange);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          exchangeStatusByCode.set(code, 'done');
          hardNavigateToDashboard();
        } else {
          console.error('[Google Auth] Exchange response had no token:', data);
          exchangeStatusByCode.delete(code);
          router.replace('/login');
        }
      })
      .catch((err) => {
        console.error('[Google Auth] Exchange error:', err);
        exchangeStatusByCode.delete(code);
        router.replace('/login');
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
      Signing you in with Google...
    </div>
  );
}
