import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import * as crypto from 'crypto';

/** Google Cloud "Authorized redirect URIs" almost always use http://localhost for local dev. */
function googleCallbackUrl(): string {
  const defaultCallback =
    process.env.NODE_ENV === 'production'
      ? 'https://api.intrabox.com.ng/auth/google/callback'
      : `http://localhost:${process.env.PORT || '3000'}/auth/google/callback`;
  const raw = process.env.GOOGLE_CALLBACK_URL?.trim() || defaultCallback;
  if (
    process.env.NODE_ENV !== 'production' &&
    /^https:\/\/localhost/i.test(raw)
  ) {
    return raw.replace(/^https:\/\/localhost/i, 'http://localhost');
  }
  return raw;
}

/**
 * HMAC-signed state store that does NOT depend on express-session.
 * This avoids the common cPanel / Passenger issue where the session cookie
 * (secure: true) is not forwarded properly through the reverse proxy,
 * causing Passport's default SessionStore to lose the OAuth state.
 */
class HmacStateStore {
  private readonly logger = new Logger('HmacStateStore');
  private readonly secret: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'google-oauth-state-fallback';
  }

  /** Called before redirecting to Google — produce a signed state token. */
  store(
    req: unknown,
    ctx: unknown,
    appState: unknown,
    meta: unknown,
    cb: (err: Error | null, state?: string) => void,
  ) {
    try {
      const payload = JSON.stringify({
        ts: Date.now(),
        n: crypto.randomBytes(12).toString('hex'),
      });
      const encoded = Buffer.from(payload).toString('base64url');
      const sig = crypto
        .createHmac('sha256', this.secret)
        .update(encoded)
        .digest('base64url');
      cb(null, `${encoded}.${sig}`);
    } catch (err) {
      cb(err as Error);
    }
  }

  /** Called on the callback — verify the signed state token. */
  verify(
    req: unknown,
    providedState: string,
    cb: (err: Error | null, ok?: boolean, info?: unknown) => void,
  ) {
    try {
      const [encoded, sig] = providedState.split('.', 2);
      if (!encoded || !sig) {
        return cb(null, false, { message: 'Malformed state' });
      }
      const expected = crypto
        .createHmac('sha256', this.secret)
        .update(encoded)
        .digest('base64url');
      if (sig !== expected) {
        this.logger.warn('Google OAuth state signature mismatch');
        return cb(null, false, { message: 'Invalid state signature' });
      }
      const payload = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8'),
      );
      // State valid for 10 minutes
      if (Date.now() - payload.ts > 10 * 60 * 1000) {
        return cb(null, false, { message: 'State expired' });
      }
      cb(null, true);
    } catch {
      cb(null, false, { message: 'State verification error' });
    }
  }
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    // The `store` option is supported by passport-oauth2 internally but is
    // missing from the @types/passport-google-oauth20 type definitions.
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: googleCallbackUrl(),
      scope: ['email', 'profile'],
      store: new HmacStateStore(),
    } as any);
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    done(null, profile);
  }
}
