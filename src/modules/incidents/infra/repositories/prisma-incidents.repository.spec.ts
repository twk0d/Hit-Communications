import {
  IncidentCategory as PrismaIncidentCategory,
  IncidentPriority as PrismaIncidentPriority,
  IncidentStatus as PrismaIncidentStatus,
} from '@prisma/client';

import { Incident } from '../../domain/entities/incident.entity';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { PrismaIncidentsClient } from '../prisma/prisma-incidents-client';
import { PrismaIncidentsRepository } from './prisma-incidents.repository';

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

const prismaIncident = {
  id: '8d843a6e-8929-44a8-8ccb-41c52773f6b1',
  title: 'VPN unavailable',
  description: 'Users cannot connect to the VPN gateway.',
  category: PrismaIncidentCategory.NETWORK,
  priority: PrismaIncidentPriority.HIGH,
  status: PrismaIncidentStatus.OPEN,
  assigneeId: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  createdAt: new Date('2026-06-29T12:00:00.000Z'),
  updatedAt: new Date('2026-06-29T13:00:00.000Z'),
  resolvedAt: null,
  deletedAt: null,
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

function makeRepository(prisma: PrismaClientMock): PrismaIncidentsRepository {
  return new PrismaIncidentsRepository(prisma as unknown as PrismaIncidentsClient);
}

function makeIncident(): Incident {
  return Incident.create({
    id: prismaIncident.id,
    title: prismaIncident.title,
    description: prismaIncident.description,
    category: IncidentCategory.NETWORK,
    priority: IncidentPriority.HIGH,
    status: IncidentStatus.OPEN,
    assigneeId: prismaIncident.assigneeId,
    createdAt: prismaIncident.createdAt,
    updatedAt: prismaIncident.updatedAt,
    resolvedAt: prismaIncident.resolvedAt,
    deletedAt: prismaIncident.deletedAt,
  });
}

describe('PrismaIncidentsRepository', () => {
  it('creates an incident', async () => {
    const prisma = makePrismaClient();
    prisma.incident.create.mockResolvedValue(prismaIncident);
    const repository = makeRepository(prisma);

    const incident = await repository.create(makeIncident());

    expect(prisma.incident.create).toHaveBeenCalledWith({
      data: prismaIncident,
    });
    expect(incident.id).toBe(prismaIncident.id);
  });

  it('finds one active incident by id', async () => {
    const prisma = makePrismaClient();
    prisma.incident.findFirst.mockResolvedValue(prismaIncident);
    const repository = makeRepository(prisma);

    const incident = await repository.findById(prismaIncident.id);

    expect(prisma.incident.findFirst).toHaveBeenCalledWith({
      where: {
        id: prismaIncident.id,
        deletedAt: null,
      },
    });
    expect(incident?.id).toBe(prismaIncident.id);
  });

  it('returns null when active incident is not found by id', async () => {
    const prisma = makePrismaClient();
    prisma.incident.findFirst.mockResolvedValue(null);
    const repository = makeRepository(prisma);

    await expect(repository.findById(prismaIncident.id)).resolves.toBeNull();
  });

  it('lists active incidents with filters, pagination and default ordering', async () => {
    const prisma = makePrismaClient();
    prisma.incident.findMany.mockResolvedValue([prismaIncident]);
    prisma.incident.count.mockResolvedValue(1);
    const repository = makeRepository(prisma);
    const createdFrom = new Date('2026-06-01T00:00:00.000Z');
    const createdTo = new Date('2026-06-30T23:59:59.000Z');
    const resolvedFrom = new Date('2026-06-10T00:00:00.000Z');
    const resolvedTo = new Date('2026-06-29T23:59:59.000Z');

    const result = await repository.findMany({
      filters: {
        status: IncidentStatus.OPEN,
        priority: IncidentPriority.HIGH,
        category: IncidentCategory.NETWORK,
        assigneeId: prismaIncident.assigneeId,
        createdFrom,
        createdTo,
        resolvedFrom,
        resolvedTo,
      },
      pagination: {
        page: 3,
        limit: 10,
        offset: 20,
      },
    });

    const where = {
      deletedAt: null,
      status: PrismaIncidentStatus.OPEN,
      priority: PrismaIncidentPriority.HIGH,
      category: PrismaIncidentCategory.NETWORK,
      assigneeId: prismaIncident.assigneeId,
      createdAt: {
        gte: createdFrom,
        lte: createdTo,
      },
      resolvedAt: {
        gte: resolvedFrom,
        lte: resolvedTo,
      },
    };
    expect(prisma.incident.findMany).toHaveBeenCalledWith({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: 20,
      take: 10,
    });
    expect(prisma.incident.count).toHaveBeenCalledWith({
      where,
    });
    expect(result.total).toBe(1);
    expect(result.incidents[0].id).toBe(prismaIncident.id);
  });

  it('updates an incident by id', async () => {
    const prisma = makePrismaClient();
    prisma.incident.update.mockResolvedValue({
      ...prismaIncident,
      priority: PrismaIncidentPriority.CRITICAL,
      updatedAt: new Date('2026-06-29T14:00:00.000Z'),
    });
    const repository = makeRepository(prisma);
    const incident = makeIncident();
    const updatedAt = new Date('2026-06-29T14:00:00.000Z');
    incident.changePriority(IncidentPriority.CRITICAL, updatedAt);

    const updatedIncident = await repository.update(incident);

    expect(prisma.incident.update).toHaveBeenCalledWith({
      where: {
        id: prismaIncident.id,
      },
      data: {
        title: prismaIncident.title,
        description: prismaIncident.description,
        category: PrismaIncidentCategory.NETWORK,
        priority: PrismaIncidentPriority.CRITICAL,
        status: PrismaIncidentStatus.OPEN,
        assigneeId: prismaIncident.assigneeId,
        createdAt: prismaIncident.createdAt,
        updatedAt,
        resolvedAt: null,
        deletedAt: null,
      },
    });
    expect(updatedIncident.priority).toBe(IncidentPriority.CRITICAL);
  });

  it('soft deletes an incident by persisting the aggregate deletedAt', async () => {
    const prisma = makePrismaClient();
    const deletedAt = new Date('2026-06-29T15:00:00.000Z');
    prisma.incident.update.mockResolvedValue({
      ...prismaIncident,
      updatedAt: deletedAt,
      deletedAt,
    });
    const repository = makeRepository(prisma);
    const incident = makeIncident();
    incident.softDelete(deletedAt);

    const deletedIncident = await repository.softDelete(incident);

    expect(prisma.incident.update).toHaveBeenCalledWith({
      where: {
        id: prismaIncident.id,
      },
      data: expect.objectContaining({
        updatedAt: deletedAt,
        deletedAt,
      }),
    });
    expect(deletedIncident.deletedAt).toEqual(deletedAt);
  });
});
