import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

/** Google Cloud "Authorized redirect URIs" almost always use http://localhost for local dev. */
function googleCallbackUrl(): string {
  const raw =
    process.env.GOOGLE_CALLBACK_URL?.trim() ||
    `http://localhost:${process.env.PORT || '3000'}/auth/google/callback`;
  if (
    process.env.NODE_ENV !== 'production' &&
    /^https:\/\/localhost/i.test(raw)
  ) {
    return raw.replace(/^https:\/\/localhost/i, 'http://localhost');
  }
  return raw;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: googleCallbackUrl(),
      scope: ['email', 'profile'],
    });
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
