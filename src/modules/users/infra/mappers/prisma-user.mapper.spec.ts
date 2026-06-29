import { UserRole as PrismaUserRole } from '@prisma/client';

import { UserRole } from '../../domain/enums/user-role.enum';
import { PrismaUserMapper } from './prisma-user.mapper';

const prismaUser = {
  id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  name: 'HIT User',
  email: 'user@hit.local',
  passwordHash: 'argon2id-hash',
  role: PrismaUserRole.USER,
  createdAt: new Date('2026-06-29T12:00:00.000Z'),
  updatedAt: new Date('2026-06-29T13:00:00.000Z'),
  deletedAt: null,
};

describe('PrismaUserMapper', () => {
  it('maps Prisma user model to domain aggregate', () => {
    const user = PrismaUserMapper.toDomain(prismaUser);

    expect(user.toSnapshot()).toEqual({
      id: prismaUser.id,
      name: 'HIT User',
      email: 'user@hit.local',
      passwordHash: 'argon2id-hash',
      role: UserRole.USER,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: null,
    });
  });

  it('maps domain aggregate to persistence data', () => {
    const user = PrismaUserMapper.toDomain({
      ...prismaUser,
      role: PrismaUserRole.ADMIN,
    });

    expect(PrismaUserMapper.toPersistence(user)).toEqual({
      id: prismaUser.id,
      name: 'HIT User',
      email: 'user@hit.local',
      passwordHash: 'argon2id-hash',
      role: PrismaUserRole.ADMIN,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: null,
    });
  });
});
