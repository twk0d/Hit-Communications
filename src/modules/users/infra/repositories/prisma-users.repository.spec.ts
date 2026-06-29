import { PrismaService } from '../../../../infra/prisma/prisma.service';
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
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('PrismaUsersRepository', () => {
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
});
