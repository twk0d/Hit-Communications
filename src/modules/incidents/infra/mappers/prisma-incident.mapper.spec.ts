import {
  IncidentCategory as PrismaIncidentCategory,
  IncidentPriority as PrismaIncidentPriority,
  IncidentStatus as PrismaIncidentStatus,
} from '@prisma/client';

import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { PrismaIncidentMapper } from './prisma-incident.mapper';

const prismaIncident = {
  id: '8d843a6e-8929-44a8-8ccb-41c52773f6b1',
  title: 'VPN unavailable',
  description: 'Users cannot connect to the VPN gateway.',
  category: PrismaIncidentCategory.NETWORK,
  priority: PrismaIncidentPriority.HIGH,
  status: PrismaIncidentStatus.IN_PROGRESS,
  assigneeId: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  createdAt: new Date('2026-06-29T12:00:00.000Z'),
  updatedAt: new Date('2026-06-29T13:00:00.000Z'),
  resolvedAt: null,
  deletedAt: null,
};

describe('PrismaIncidentMapper', () => {
  it('maps Prisma incident model to domain aggregate', () => {
    const incident = PrismaIncidentMapper.toDomain(prismaIncident);

    expect(incident.toSnapshot()).toEqual({
      id: prismaIncident.id,
      title: 'VPN unavailable',
      description: 'Users cannot connect to the VPN gateway.',
      category: IncidentCategory.NETWORK,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.IN_PROGRESS,
      assigneeId: prismaIncident.assigneeId,
      createdAt: prismaIncident.createdAt,
      updatedAt: prismaIncident.updatedAt,
      resolvedAt: null,
      deletedAt: null,
    });
  });

  it('maps domain aggregate to persistence data', () => {
    const incident = PrismaIncidentMapper.toDomain({
      ...prismaIncident,
      status: PrismaIncidentStatus.RESOLVED,
      resolvedAt: new Date('2026-06-29T14:00:00.000Z'),
    });

    expect(PrismaIncidentMapper.toPersistence(incident)).toEqual({
      ...prismaIncident,
      status: PrismaIncidentStatus.RESOLVED,
      resolvedAt: new Date('2026-06-29T14:00:00.000Z'),
    });
  });
});
