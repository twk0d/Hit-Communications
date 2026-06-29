import { UnauthorizedError } from '../../../../shared/application/errors/application.error';
import { User } from '../../../users/domain/entities/user.entity';
import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';
import { PasswordHasher } from '../contracts/password-hasher';
import { TokenService } from '../contracts/token-service';
import { LoginUseCase } from './login.use-case';

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
    findById: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(user),
    findByEmailIncludingDeleted: jest.fn(),
  };
}

function makePasswordHasher(matches: boolean): PasswordHasher {
  return {
    hash: jest.fn(),
    verify: jest.fn().mockResolvedValue(matches),
  };
}

function makeTokenService(): TokenService {
  return {
    signAccessToken: jest.fn().mockResolvedValue('access-token'),
  };
}

describe('LoginUseCase', () => {
  it('returns access token and public user data for valid credentials', async () => {
    const usersRepository = makeUsersRepository(activeUser);
    const passwordHasher = makePasswordHasher(true);
    const tokenService = makeTokenService();
    const useCase = new LoginUseCase(usersRepository, passwordHasher, tokenService);

    await expect(
      useCase.execute({
        email: 'USER@hit.local',
        password: 'User123!',
      }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      user: {
        id: activeUser.id,
        name: 'HIT User',
        email: 'user@hit.local',
        role: UserRole.USER,
        createdAt: '2026-06-29T12:00:00.000Z',
        updatedAt: '2026-06-29T12:00:00.000Z',
      },
    });
    expect(usersRepository.findByEmail).toHaveBeenCalledWith('user@hit.local');
    expect(passwordHasher.verify).toHaveBeenCalledWith('argon2id-hash', 'User123!');
    expect(tokenService.signAccessToken).toHaveBeenCalledWith({
      sub: activeUser.id,
      email: 'user@hit.local',
      role: UserRole.USER,
    });
  });

  it('throws UnauthorizedError when user does not exist', async () => {
    const useCase = new LoginUseCase(
      makeUsersRepository(null),
      makePasswordHasher(true),
      makeTokenService(),
    );

    await expect(
      useCase.execute({
        email: 'missing@hit.local',
        password: 'User123!',
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when password does not match', async () => {
    const useCase = new LoginUseCase(
      makeUsersRepository(activeUser),
      makePasswordHasher(false),
      makeTokenService(),
    );

    await expect(
      useCase.execute({
        email: 'user@hit.local',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('treats soft-deleted users as invalid credentials', async () => {
    const deletedUser = User.create({
      ...activeUser.toSnapshot(),
      deletedAt: new Date('2026-06-29T13:00:00.000Z'),
    });
    const useCase = new LoginUseCase(
      makeUsersRepository(deletedUser),
      makePasswordHasher(true),
      makeTokenService(),
    );

    await expect(
      useCase.execute({
        email: 'user@hit.local',
        password: 'User123!',
      }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
