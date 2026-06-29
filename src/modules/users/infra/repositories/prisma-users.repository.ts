import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { UsersRepository } from '../../domain/repositories/users.repository';
import { PrismaUserMapper } from '../mappers/prisma-user.mapper';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return users.map(PrismaUserMapper.toDomain);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    return user ? PrismaUserMapper.toDomain(user) : null;
  }
}
