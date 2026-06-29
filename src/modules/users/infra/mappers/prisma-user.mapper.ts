import { User as PrismaUserModel, UserRole as PrismaUserRole } from '@prisma/client';

import { User, UserProps } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';

type PrismaUserPersistence = Omit<PrismaUserModel, 'role'> & {
  role: PrismaUserRole;
};

const prismaToDomainRole: Record<PrismaUserRole, UserRole> = {
  ADMIN: UserRole.ADMIN,
  USER: UserRole.USER,
};

const domainToPrismaRole: Record<UserRole, PrismaUserRole> = {
  ADMIN: PrismaUserRole.ADMIN,
  USER: PrismaUserRole.USER,
};

export class PrismaUserMapper {
  static toDomain(user: PrismaUserPersistence): User {
    return User.create({
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: prismaToDomainRole[user.role],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    });
  }

  static toPersistence(user: User): PrismaUserPersistence {
    const snapshot: UserProps = user.toSnapshot();

    return {
      id: snapshot.id,
      name: snapshot.name,
      email: snapshot.email,
      passwordHash: snapshot.passwordHash,
      role: domainToPrismaRole[snapshot.role],
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
      deletedAt: snapshot.deletedAt,
    };
  }
}
