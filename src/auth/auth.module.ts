import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { RolesExampleController } from './roles-example.controller';
import { GoogleStrategy } from './google.strategy';
import { GoogleAuthGuard } from './google-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [AuthController, RolesExampleController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GoogleAuthGuard,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
