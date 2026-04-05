import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            user: { findFirst: jest.fn(), updateMany: jest.fn() },
            customer: { findFirst: jest.fn(), create: jest.fn() },
            conversation: { create: jest.fn(), updateMany: jest.fn() },
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "INTRA API Online"', () => {
      expect(appController.getHello()).toBe('INTRA API Online');
    });
  });
});
