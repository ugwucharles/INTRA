import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';

function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'META_VERIFY_TOKEN',
    'META_APP_SECRET',
    'META_PAGE_ACCESS_TOKEN',
  ];

  const missing = required.filter((key) => {
    if (key === 'META_APP_SECRET') {
      return !process.env.META_APP_SECRET && !process.env.INSTAGRAM_APP_SECRET;
    }
    return !process.env[key];
  });
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Google OAuth (Passport) needs a session to store state between /auth/google and the callback.
  const isProd = process.env.NODE_ENV === 'production';
  app.set('trust proxy', 1);
  app.use(
    session({
      secret: process.env.JWT_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 10 * 60 * 1000,
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
      },
    }),
  );
  app.use(passport.initialize());
  // passport.session() runs the "session" strategy on every request. If a cookie
  // ever had req.session.passport.user but no deserializer was registered, Passport
  // threw "Failed to deserialize user out of session" → 500. We are JWT-based;
  // Google uses authenticate({ session: false }), so never restore a user here.
  passport.deserializeUser((payload: unknown, done) => {
    done(null, false);
  });
  app.use(passport.session());

  // ── Security headers (Helmet) ──────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: false, // handled at nginx/CDN layer
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ── Body size limits — prevent DoS via large payloads ─────────────────────
  app.use(
    bodyParser.json({
      // Profile pictures are currently sent as base64 data URLs from the frontend.
      // Base64 adds ~33% overhead, so keep this comfortably above the UI's 2MB file cap.
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf; // needed for Meta webhook signature verification
      },
    }),
  );
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // ── CORS — production domains + typical local dev (override with ALLOWED_ORIGINS)
  const defaultOrigins =
    process.env.NODE_ENV === 'production'
      ? 'https://intrabox.com.ng,https://www.intrabox.com.ng'
      : 'http://localhost:3001,http://localhost:3000,https://intrabox.com.ng,https://www.intrabox.com.ng';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? defaultOrigins)
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, origin?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
