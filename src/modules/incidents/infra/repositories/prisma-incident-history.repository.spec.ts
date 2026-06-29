import { IncidentHistory } from '../../domain/entities/incident-history.entity';
import { PrismaIncidentsClient } from '../prisma/prisma-incidents-client';
import { PrismaIncidentHistoryRepository } from './prisma-incident-history.repository';

type PrismaClientMock = {
  incident: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  incidentHistory: {
    createMany: jest.Mock;
    findMany: jest.Mock;
  };
};

const prismaHistory = {
  id: '9681cfe6-ed3b-463d-a868-e9a38bd8cff9',
  incidentId: '8d843a6e-8929-44a8-8ccb-41c52773f6b1',
  field: 'status',
  oldValue: 'OPEN',
  newValue: 'IN_PROGRESS',
  changedById: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  changedAt: new Date('2026-06-29T13:00:00.000Z'),
};

function makePrismaClient(): PrismaClientMock {
  return {
    incident: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    incidentHistory: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

function makeRepository(
  prisma: PrismaClientMock,
): PrismaIncidentHistoryRepository {
  return new PrismaIncidentHistoryRepository(
    prisma as unknown as PrismaIncidentsClient,
  );
}

describe('PrismaIncidentHistoryRepository', () => {
  it('creates many history records', async () => {
    const prisma = makePrismaClient();
    prisma.incidentHistory.createMany.mockResolvedValue({ count: 1 });
    const repository = makeRepository(prisma);

    await repository.createMany([IncidentHistory.create(prismaHistory)]);

    expect(prisma.incidentHistory.createMany).toHaveBeenCalledWith({
      data: [prismaHistory],
    });
  });

  it('does not call Prisma when there is no history to create', async () => {
    const prisma = makePrismaClient();
    const repository = makeRepository(prisma);

    await repository.createMany([]);

    expect(prisma.incidentHistory.createMany).not.toHaveBeenCalled();
  });

  it('finds history records ordered by changedAt descending', async () => {
    const prisma = makePrismaClient();
    prisma.incidentHistory.findMany.mockResolvedValue([prismaHistory]);
    const repository = makeRepository(prisma);

    const history = await repository.findManyByIncidentId({
      incidentId: prismaHistory.incidentId,
    });

    expect(prisma.incidentHistory.findMany).toHaveBeenCalledWith({
      where: {
        incidentId: prismaHistory.incidentId,
      },
      orderBy: {
        changedAt: 'desc',
      },
    });
    expect(history[0].id).toBe(prismaHistory.id);
  });
});
