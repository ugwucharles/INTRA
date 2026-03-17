import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'META_VERIFY_TOKEN',
    'META_DEFAULT_ORG_ID',
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

  // Capture rawBody for signature verification (e.g. Meta webhooks)
  // Capture rawBody for signature verification (e.g. Meta webhooks)
  app.use(
    bodyParser.json({
      limit: '50mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS for frontend
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
