import { Inject, Injectable } from '@nestjs/common';
import {
  IncidentCategory as PrismaIncidentCategory,
  IncidentPriority as PrismaIncidentPriority,
  IncidentStatus as PrismaIncidentStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { Incident } from '../../domain/entities/incident.entity';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import {
  IncidentsRepository,
  ListIncidentsFilters,
  ListIncidentsInput,
  ListIncidentsResult,
} from '../../domain/repositories/incidents.repository';
import { PrismaIncidentMapper } from '../mappers/prisma-incident.mapper';
import { PrismaIncidentsClient } from '../prisma/prisma-incidents-client';

const domainToPrismaCategory: Record<IncidentCategory, PrismaIncidentCategory> = {
  ACCESS: PrismaIncidentCategory.ACCESS,
  DATA: PrismaIncidentCategory.DATA,
  INFRASTRUCTURE: PrismaIncidentCategory.INFRASTRUCTURE,
  NETWORK: PrismaIncidentCategory.NETWORK,
  PROCESS: PrismaIncidentCategory.PROCESS,
  SYSTEM: PrismaIncidentCategory.SYSTEM,
};

const domainToPrismaPriority: Record<IncidentPriority, PrismaIncidentPriority> = {
  CRITICAL: PrismaIncidentPriority.CRITICAL,
  HIGH: PrismaIncidentPriority.HIGH,
  LOW: PrismaIncidentPriority.LOW,
  MEDIUM: PrismaIncidentPriority.MEDIUM,
};

const domainToPrismaStatus: Record<IncidentStatus, PrismaIncidentStatus> = {
  CANCELED: PrismaIncidentStatus.CANCELED,
  IN_PROGRESS: PrismaIncidentStatus.IN_PROGRESS,
  OPEN: PrismaIncidentStatus.OPEN,
  RESOLVED: PrismaIncidentStatus.RESOLVED,
};

@Injectable()
export class PrismaIncidentsRepository implements IncidentsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaIncidentsClient,
  ) {}

  async create(incident: Incident): Promise<Incident> {
    const createdIncident = await this.prisma.incident.create({
      data: PrismaIncidentMapper.toPersistence(incident),
    });

    return PrismaIncidentMapper.toDomain(createdIncident);
  }

  async findById(id: string): Promise<Incident | null> {
    const incident = await this.prisma.incident.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    return incident ? PrismaIncidentMapper.toDomain(incident) : null;
  }

  async findMany(input: ListIncidentsInput): Promise<ListIncidentsResult> {
    const where = buildWhere(input.filters);
    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: input.pagination.offset,
        take: input.pagination.limit,
      }),
      this.prisma.incident.count({
        where,
      }),
    ]);

    return {
      incidents: incidents.map(PrismaIncidentMapper.toDomain),
      total,
    };
  }

  async update(incident: Incident): Promise<Incident> {
    const { id, ...data } = PrismaIncidentMapper.toPersistence(incident);
    const updatedIncident = await this.prisma.incident.update({
      where: {
        id,
      },
      data,
    });

    return PrismaIncidentMapper.toDomain(updatedIncident);
  }

  async softDelete(incident: Incident): Promise<Incident> {
    return this.update(incident);
  }
}

function buildWhere(filters: ListIncidentsFilters = {}): Prisma.IncidentWhereInput {
  const where: Prisma.IncidentWhereInput = {
    deletedAt: null,
  };

  if (filters.status) {
    where.status = domainToPrismaStatus[filters.status];
  }

  if (filters.priority) {
    where.priority = domainToPrismaPriority[filters.priority];
  }

  if (filters.category) {
    where.category = domainToPrismaCategory[filters.category];
  }

  if (filters.assigneeId) {
    where.assigneeId = filters.assigneeId;
  }

  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {
      ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
      ...(filters.createdTo ? { lte: filters.createdTo } : {}),
    };
  }

  if (filters.resolvedFrom || filters.resolvedTo) {
    where.resolvedAt = {
      ...(filters.resolvedFrom ? { gte: filters.resolvedFrom } : {}),
      ...(filters.resolvedTo ? { lte: filters.resolvedTo } : {}),
    };
  }

  return where;
}
