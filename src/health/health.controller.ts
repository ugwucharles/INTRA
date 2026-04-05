import { Controller, Get } from '@nestjs/common';

const startedAt = Date.now();

@Controller()
export class HealthController {
  @Get('health')
  getHealth() {
    const now = Date.now();
    const uptimeSeconds = Math.round((now - startedAt) / 1000);

    return {
      status: 'ok',
      uptimeSeconds,
      timestamp: new Date(now).toISOString(),
    };
  }
}
