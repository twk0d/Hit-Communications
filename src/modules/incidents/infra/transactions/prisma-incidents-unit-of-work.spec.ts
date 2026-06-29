import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { PrismaIncidentsUnitOfWork } from './prisma-incidents-unit-of-work';

const prismaIncident = {
  id: '8d843a6e-8929-44a8-8ccb-41c52773f6b1',
  title: 'VPN unavailable',
  description: 'Users cannot connect to the VPN gateway.',
  category: 'NETWORK',
  priority: 'HIGH',
  status: 'OPEN',
  assigneeId: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  createdAt: new Date('2026-06-29T12:00:00.000Z'),
  updatedAt: new Date('2026-06-29T13:00:00.000Z'),
  resolvedAt: null,
  deletedAt: null,
};

const prismaHistory = {
  id: '9681cfe6-ed3b-463d-a868-e9a38bd8cff9',
  incidentId: prismaIncident.id,
  field: 'status',
  oldValue: 'OPEN',
  newValue: 'IN_PROGRESS',
  changedById: prismaIncident.assigneeId,
  changedAt: new Date('2026-06-29T13:00:00.000Z'),
};

describe('PrismaIncidentsUnitOfWork', () => {
  it('executes incident repositories inside a Prisma transaction', async () => {
    const transaction = {
      incident: {
        findFirst: jest.fn().mockResolvedValue(prismaIncident),
      },
      incidentHistory: {
        findMany: jest.fn().mockResolvedValue([prismaHistory]),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        async (
          handler: (transactionClient: typeof transaction) => Promise<string>,
        ) => handler(transaction),
      ),
    };
    const unitOfWork = new PrismaIncidentsUnitOfWork(
      prisma as unknown as PrismaService,
    );

    const result = await unitOfWork.execute(
      async ({ incidentsRepository, incidentHistoryRepository }) => {
        const incident = await incidentsRepository.findById(prismaIncident.id);
        const history = await incidentHistoryRepository.findManyByIncidentId({
          incidentId: prismaIncident.id,
        });

        return `${incident?.id}:${history.length}`;
      },
    );

    expect(result).toBe(`${prismaIncident.id}:1`);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.incident.findFirst).toHaveBeenCalledWith({
      where: {
        id: prismaIncident.id,
        deletedAt: null,
      },
    });
    expect(transaction.incidentHistory.findMany).toHaveBeenCalledWith({
      where: {
        incidentId: prismaIncident.id,
      },
      orderBy: {
        changedAt: 'desc',
      },
    });
  });
});
