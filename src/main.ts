import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';

function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'META_VERIFY_TOKEN',
    'META_APP_SECRET',
    'META_PAGE_ACCESS_TOKEN',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule);

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
      limit: '5mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf; // needed for Meta webhook signature verification
      },
    }),
  );
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

  // ── CORS — locked to production domain only ────────────────────────────────
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'https://intrabox.com.ng')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) => {
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

