import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { User } from '../../../users/domain/entities/user.entity';
import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';
import { GetMeUseCase } from './get-me.use-case';

const activeUser = User.create({
  id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  name: 'HIT User',
  email: 'user@hit.local',
  passwordHash: 'argon2id-hash',
  role: UserRole.USER,
  createdAt: new Date('2026-06-29T12:00:00.000Z'),
  updatedAt: new Date('2026-06-29T12:00:00.000Z'),
  deletedAt: null,
});

function makeUsersRepository(user: User | null): UsersRepository {
  return {
    create: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn().mockResolvedValue(user),
    findByEmail: jest.fn(),
    findByEmailIncludingDeleted: jest.fn(),
  };
}

describe('GetMeUseCase', () => {
  it('returns public authenticated user data', async () => {
    const useCase = new GetMeUseCase(makeUsersRepository(activeUser));

    await expect(
      useCase.execute({
        userId: activeUser.id,
      }),
    ).resolves.toEqual({
      id: activeUser.id,
      name: 'HIT User',
      email: 'user@hit.local',
      role: UserRole.USER,
      createdAt: '2026-06-29T12:00:00.000Z',
      updatedAt: '2026-06-29T12:00:00.000Z',
    });
  });

  it('throws ResourceNotFoundError when authenticated user no longer exists', async () => {
    const useCase = new GetMeUseCase(makeUsersRepository(null));

    await expect(
      useCase.execute({
        userId: 'missing-user-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
