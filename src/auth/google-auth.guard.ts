import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Passport forwards OAuth/token errors as plain Error objects; the default
 * AuthGuard rethrows them raw → Nest responds with 500. This guard maps them
 * to 401 with a useful message (especially for local debugging).
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  handleRequest<TUser = unknown>(
    err: unknown,
    user: unknown,
    info: unknown,
    _ctx: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err) {
      const e = err as {
        message?: string;
        oauthError?: { message?: string; data?: string; statusCode?: number };
        stack?: string;
      };
      const o = e.oauthError;
      const data =
        o && typeof o === 'object' && 'data' in o ? String((o as { data: unknown }).data) : '';
      const oauthMsg =
        o && typeof o === 'object' && 'message' in o ? String((o as { message: unknown }).message) : '';
      const msg = (data && data.trim()) || oauthMsg || e.message || 'Google authentication failed';
      this.logger.error(`Google OAuth: ${msg}`, e.stack);
      throw new UnauthorizedException(msg);
    }
    if (!user) {
      const infoMsg =
        info && typeof info === 'object' && 'message' in info
          ? String((info as { message: unknown }).message)
          : 'Google did not return a user profile';
      this.logger.warn(`Google OAuth: no user (${infoMsg})`);
      throw new UnauthorizedException(infoMsg);
    }
    return user as TUser;
  }

  /** Do not call req.logIn — we have no passport.serializeUser (JWT is used after redirect). */
  getAuthenticateOptions(_context: ExecutionContext) {
    return { session: false };
  }
}
