import { Module } from '@nestjs/common';

import { USERS_REPOSITORY, UsersRepository } from './domain/repositories/users.repository';
import { PrismaUsersRepository } from './infra/repositories/prisma-users.repository';
import { UsersController } from './presentation/controllers/users.controller';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { JwtAuthGuard } from '../auth/infra/guards/jwt-auth.guard';
import { GetUserByIdUseCase } from './application/use-cases/get-user-by-id.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    PrismaUsersRepository,
    JwtAuthGuard,
    {
      provide: USERS_REPOSITORY,
      useExisting: PrismaUsersRepository,
    },
    {
      provide: ListUsersUseCase,
      inject: [USERS_REPOSITORY],
      useFactory: (usersRepository: UsersRepository) =>
        new ListUsersUseCase(usersRepository),
    },
    {
      provide: GetUserByIdUseCase,
      inject: [USERS_REPOSITORY],
      useFactory: (usersRepository: UsersRepository) =>
        new GetUserByIdUseCase(usersRepository),
    },
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
