import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { PrismaUsersRepository } from './prisma-users.repository';

const prismaUser = {
  id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  name: 'HIT User',
  email: 'user@hit.local',
  passwordHash: 'argon2id-hash',
  role: UserRole.USER,
  createdAt: new Date('2026-06-29T12:00:00.000Z'),
  updatedAt: new Date('2026-06-29T13:00:00.000Z'),
  deletedAt: null,
};

function makePrismaService() {
  return {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('PrismaUsersRepository', () => {
  it('creates a user', async () => {
    const prisma = makePrismaService();
    jest.spyOn(prisma.user, 'create').mockResolvedValue(prismaUser);
    const repository = new PrismaUsersRepository(prisma);
    const userToCreate = User.create({
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      role: UserRole.USER,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: prismaUser.deletedAt,
    });

    const user = await repository.create(userToCreate);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        id: prismaUser.id,
        name: 'HIT User',
        email: 'user@hit.local',
        passwordHash: 'argon2id-hash',
        role: UserRole.USER,
        createdAt: prismaUser.createdAt,
        updatedAt: prismaUser.updatedAt,
        deletedAt: null,
      },
    });
    expect(user.id).toBe(prismaUser.id);
  });

  it('finds active users ordered by name', async () => {
    const prisma = makePrismaService();
    jest.spyOn(prisma.user, 'findMany').mockResolvedValue([prismaUser]);
    const repository = new PrismaUsersRepository(prisma);

    const users = await repository.findMany();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('user@hit.local');
  });

  it('finds one active user by id', async () => {
    const prisma = makePrismaService();
    jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(prismaUser);
    const repository = new PrismaUsersRepository(prisma);

    const user = await repository.findById(prismaUser.id);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: prismaUser.id,
        deletedAt: null,
      },
    });
    expect(user?.id).toBe(prismaUser.id);
  });

  it('returns null when active user is not found by id', async () => {
    const prisma = makePrismaService();
    jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);
    const repository = new PrismaUsersRepository(prisma);

    await expect(repository.findById(prismaUser.id)).resolves.toBeNull();
  });

  it('finds one active user by email', async () => {
    const prisma = makePrismaService();
    jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(prismaUser);
    const repository = new PrismaUsersRepository(prisma);

    const user = await repository.findByEmail('user@hit.local');

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: 'user@hit.local',
        deletedAt: null,
      },
    });
    expect(user?.email).toBe('user@hit.local');
  });

  it('finds one user by email including soft-deleted records for uniqueness checks', async () => {
    const prisma = makePrismaService();
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      ...prismaUser,
      deletedAt: new Date('2026-06-29T13:00:00.000Z'),
    });
    const repository = new PrismaUsersRepository(prisma);

    const user = await repository.findByEmailIncludingDeleted('user@hit.local');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: 'user@hit.local',
      },
    });
    expect(user?.email).toBe('user@hit.local');
    expect(user?.deletedAt).toEqual(new Date('2026-06-29T13:00:00.000Z'));
  });
});
