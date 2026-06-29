import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { UsersRepository } from '../../domain/repositories/users.repository';
import { PrismaUserMapper } from '../mappers/prisma-user.mapper';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: PrismaUserMapper.toPersistence(user),
    });

    return PrismaUserMapper.toDomain(createdUser);
  }

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

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    return user ? PrismaUserMapper.toDomain(user) : null;
  }

  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    return user ? PrismaUserMapper.toDomain(user) : null;
  }
}
