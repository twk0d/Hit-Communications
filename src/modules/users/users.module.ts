import { Module } from '@nestjs/common';

import { USERS_REPOSITORY } from './domain/repositories/users.repository';
import { PrismaUsersRepository } from './infra/repositories/prisma-users.repository';
import { PrismaModule } from '../../infra/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaUsersRepository,
    {
      provide: USERS_REPOSITORY,
      useExisting: PrismaUsersRepository,
    },
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
