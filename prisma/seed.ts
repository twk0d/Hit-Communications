import { PrismaClient, UserRole } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function upsertUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<void> {
  const passwordHash = await argon2.hash(params.password, {
    type: argon2.argon2id,
  });

  await prisma.user.upsert({
    where: {
      email: params.email,
    },
    update: {
      name: params.name,
      role: params.role,
      passwordHash,
      deletedAt: null,
    },
    create: {
      name: params.name,
      email: params.email,
      role: params.role,
      passwordHash,
    },
  });
}

async function main(): Promise<void> {
  await upsertUser({
    name: 'HIT Admin',
    email: 'admin@hit.local',
    password: 'Admin123!',
    role: UserRole.ADMIN,
  });

  await upsertUser({
    name: 'HIT User',
    email: 'user@hit.local',
    password: 'User123!',
    role: UserRole.USER,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
