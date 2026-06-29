import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UsersRepository } from '../../domain/repositories/users.repository';
import { ListUsersUseCase } from './list-users.use-case';

function makeUser(params: {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  deletedAt?: Date | null;
}): User {
  return User.create({
    id: params.id,
    name: params.name,
    email: params.email,
    passwordHash: 'argon2id-hash',
    role: params.role ?? UserRole.USER,
    createdAt: new Date('2026-06-29T12:00:00.000Z'),
    updatedAt: new Date('2026-06-29T12:00:00.000Z'),
    deletedAt: params.deletedAt ?? null,
  });
}

function makeRepository(users: User[]): UsersRepository {
  return {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue(users),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailIncludingDeleted: jest.fn(),
  };
}

describe('ListUsersUseCase', () => {
  it('returns active users without password hashes', async () => {
    const repository = makeRepository([
      makeUser({
        id: '261bda90-8850-410f-89b2-154b611bbbd0',
        name: 'HIT Admin',
        email: 'admin@hit.local',
        role: UserRole.ADMIN,
      }),
      makeUser({
        id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
        name: 'HIT User',
        email: 'user@hit.local',
      }),
    ]);
    const useCase = new ListUsersUseCase(repository);

    await expect(useCase.execute()).resolves.toEqual([
      {
        id: '261bda90-8850-410f-89b2-154b611bbbd0',
        name: 'HIT Admin',
        email: 'admin@hit.local',
        role: UserRole.ADMIN,
        createdAt: '2026-06-29T12:00:00.000Z',
        updatedAt: '2026-06-29T12:00:00.000Z',
      },
      {
        id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
        name: 'HIT User',
        email: 'user@hit.local',
        role: UserRole.USER,
        createdAt: '2026-06-29T12:00:00.000Z',
        updatedAt: '2026-06-29T12:00:00.000Z',
      },
    ]);
  });

  it('does not return soft-deleted users', async () => {
    const repository = makeRepository([
      makeUser({
        id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
        name: 'HIT User',
        email: 'user@hit.local',
      }),
      makeUser({
        id: '03a28978-280c-4e78-b60c-1581f811d1eb',
        name: 'Deleted User',
        email: 'deleted@hit.local',
        deletedAt: new Date('2026-06-29T13:00:00.000Z'),
      }),
    ]);
    const useCase = new ListUsersUseCase(repository);

    await expect(useCase.execute()).resolves.toHaveLength(1);
  });
});
