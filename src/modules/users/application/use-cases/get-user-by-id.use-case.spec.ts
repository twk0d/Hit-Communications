import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UsersRepository } from '../../domain/repositories/users.repository';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';

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

function makeRepository(user: User | null): UsersRepository {
  return {
    findMany: jest.fn(),
    findById: jest.fn().mockResolvedValue(user),
  };
}

describe('GetUserByIdUseCase', () => {
  it('returns public user data by id', async () => {
    const repository = makeRepository(activeUser);
    const useCase = new GetUserByIdUseCase(repository);

    await expect(
      useCase.execute({
        id: activeUser.id,
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

  it('throws ResourceNotFoundError when the user does not exist', async () => {
    const repository = makeRepository(null);
    const useCase = new GetUserByIdUseCase(repository);

    await expect(
      useCase.execute({
        id: 'missing-user-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('treats soft-deleted users as not found', async () => {
    const deletedUser = User.create({
      ...activeUser.toSnapshot(),
      deletedAt: new Date('2026-06-29T13:00:00.000Z'),
    });
    const repository = makeRepository(deletedUser);
    const useCase = new GetUserByIdUseCase(repository);

    await expect(
      useCase.execute({
        id: deletedUser.id,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
