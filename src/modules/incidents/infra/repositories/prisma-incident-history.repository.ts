import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IncidentHistory } from '../../domain/entities/incident-history.entity';
import {
  FindIncidentHistoryInput,
  IncidentHistoryRepository,
} from '../../domain/repositories/incident-history.repository';
import { PrismaIncidentHistoryMapper } from '../mappers/prisma-incident-history.mapper';
import { PrismaIncidentsClient } from '../prisma/prisma-incidents-client';

@Injectable()
export class PrismaIncidentHistoryRepository implements IncidentHistoryRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaIncidentsClient,
  ) {}

  async createMany(history: IncidentHistory[]): Promise<void> {
    if (history.length === 0) {
      return;
    }

    await this.prisma.incidentHistory.createMany({
      data: history.map(PrismaIncidentHistoryMapper.toPersistence),
    });
  }

  async findManyByIncidentId(
    input: FindIncidentHistoryInput,
  ): Promise<IncidentHistory[]> {
    const history = await this.prisma.incidentHistory.findMany({
      where: {
        incidentId: input.incidentId,
      },
      orderBy: {
        changedAt: 'desc',
      },
    });

    return history.map(PrismaIncidentHistoryMapper.toDomain);
  }
}
