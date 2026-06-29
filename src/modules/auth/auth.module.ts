import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { CLOCK } from '../../shared/application/clock/clock';
import { ID_GENERATOR } from '../../shared/application/ids/id-generator';
import { SystemClock } from '../../shared/infra/clock/system-clock';
import { RandomUuidGenerator } from '../../shared/infra/ids/random-uuid-generator';
import { USERS_REPOSITORY, UsersRepository } from '../users/domain/repositories/users.repository';
import { UsersModule } from '../users/users.module';
import { PASSWORD_HASHER, PasswordHasher } from './application/contracts/password-hasher';
import { TOKEN_SERVICE, TokenService } from './application/contracts/token-service';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { Argon2PasswordHasher } from './infra/crypto/argon2-password-hasher';
import { JwtAuthGuard } from './infra/guards/jwt-auth.guard';
import { JwtStrategy } from './infra/strategies/jwt.strategy';
import { JwtTokenService } from './infra/tokens/jwt-token.service';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: getJwtSecret(configService),
        signOptions: {
          expiresIn: getJwtExpiresIn(configService),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    Argon2PasswordHasher,
    JwtTokenService,
    {
      provide: PASSWORD_HASHER,
      useExisting: Argon2PasswordHasher,
    },
    {
      provide: TOKEN_SERVICE,
      useExisting: JwtTokenService,
    },
    {
      provide: ID_GENERATOR,
      useClass: RandomUuidGenerator,
    },
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
    {
      provide: RegisterUserUseCase,
      inject: [USERS_REPOSITORY, PASSWORD_HASHER, ID_GENERATOR, CLOCK],
      useFactory: (
        usersRepository: UsersRepository,
        passwordHasher: PasswordHasher,
        idGenerator: RandomUuidGenerator,
        clock: SystemClock,
      ) => new RegisterUserUseCase(usersRepository, passwordHasher, idGenerator, clock),
    },
    {
      provide: LoginUseCase,
      inject: [USERS_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE],
      useFactory: (
        usersRepository: UsersRepository,
        passwordHasher: PasswordHasher,
        tokenService: TokenService,
      ) => new LoginUseCase(usersRepository, passwordHasher, tokenService),
    },
    {
      provide: GetMeUseCase,
      inject: [USERS_REPOSITORY],
      useFactory: (usersRepository: UsersRepository) => new GetMeUseCase(usersRepository),
    },
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}

function getJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return secret;
}

function getJwtExpiresIn(
  configService: ConfigService,
): NonNullable<JwtModuleOptions['signOptions']>['expiresIn'] {
  return (configService.get<string>('JWT_EXPIRES_IN') ??
    '1h') as NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];
}
