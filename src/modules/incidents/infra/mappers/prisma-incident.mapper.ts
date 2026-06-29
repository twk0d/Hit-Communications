import {
  Incident as PrismaIncidentModel,
  IncidentCategory as PrismaIncidentCategory,
  IncidentPriority as PrismaIncidentPriority,
  IncidentStatus as PrismaIncidentStatus,
} from '@prisma/client';

import { Incident, IncidentProps } from '../../domain/entities/incident.entity';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';

type PrismaIncidentPersistence = Omit<
  PrismaIncidentModel,
  'category' | 'priority' | 'status'
> & {
  category: PrismaIncidentCategory;
  priority: PrismaIncidentPriority;
  status: PrismaIncidentStatus;
};

const prismaToDomainCategory: Record<PrismaIncidentCategory, IncidentCategory> = {
  ACCESS: IncidentCategory.ACCESS,
  DATA: IncidentCategory.DATA,
  INFRASTRUCTURE: IncidentCategory.INFRASTRUCTURE,
  NETWORK: IncidentCategory.NETWORK,
  PROCESS: IncidentCategory.PROCESS,
  SYSTEM: IncidentCategory.SYSTEM,
};

const domainToPrismaCategory: Record<IncidentCategory, PrismaIncidentCategory> = {
  ACCESS: PrismaIncidentCategory.ACCESS,
  DATA: PrismaIncidentCategory.DATA,
  INFRASTRUCTURE: PrismaIncidentCategory.INFRASTRUCTURE,
  NETWORK: PrismaIncidentCategory.NETWORK,
  PROCESS: PrismaIncidentCategory.PROCESS,
  SYSTEM: PrismaIncidentCategory.SYSTEM,
};

const prismaToDomainPriority: Record<PrismaIncidentPriority, IncidentPriority> = {
  CRITICAL: IncidentPriority.CRITICAL,
  HIGH: IncidentPriority.HIGH,
  LOW: IncidentPriority.LOW,
  MEDIUM: IncidentPriority.MEDIUM,
};

const domainToPrismaPriority: Record<IncidentPriority, PrismaIncidentPriority> = {
  CRITICAL: PrismaIncidentPriority.CRITICAL,
  HIGH: PrismaIncidentPriority.HIGH,
  LOW: PrismaIncidentPriority.LOW,
  MEDIUM: PrismaIncidentPriority.MEDIUM,
};

const prismaToDomainStatus: Record<PrismaIncidentStatus, IncidentStatus> = {
  CANCELED: IncidentStatus.CANCELED,
  IN_PROGRESS: IncidentStatus.IN_PROGRESS,
  OPEN: IncidentStatus.OPEN,
  RESOLVED: IncidentStatus.RESOLVED,
};

const domainToPrismaStatus: Record<IncidentStatus, PrismaIncidentStatus> = {
  CANCELED: PrismaIncidentStatus.CANCELED,
  IN_PROGRESS: PrismaIncidentStatus.IN_PROGRESS,
  OPEN: PrismaIncidentStatus.OPEN,
  RESOLVED: PrismaIncidentStatus.RESOLVED,
};

export class PrismaIncidentMapper {
  static toDomain(incident: PrismaIncidentPersistence): Incident {
    return Incident.create({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      category: prismaToDomainCategory[incident.category],
      priority: prismaToDomainPriority[incident.priority],
      status: prismaToDomainStatus[incident.status],
      assigneeId: incident.assigneeId,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
      resolvedAt: incident.resolvedAt,
      deletedAt: incident.deletedAt,
    });
  }

  static toPersistence(incident: Incident): PrismaIncidentPersistence {
    const snapshot: IncidentProps = incident.toSnapshot();

    return {
      id: snapshot.id,
      title: snapshot.title,
      description: snapshot.description,
      category: domainToPrismaCategory[snapshot.category],
      priority: domainToPrismaPriority[snapshot.priority],
      status: domainToPrismaStatus[snapshot.status],
      assigneeId: snapshot.assigneeId,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
      resolvedAt: snapshot.resolvedAt,
      deletedAt: snapshot.deletedAt,
    };
  }
}
