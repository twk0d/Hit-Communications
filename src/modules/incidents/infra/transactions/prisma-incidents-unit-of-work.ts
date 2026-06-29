import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infra/prisma/prisma.service';
import {
  IncidentsTransactionContext,
  IncidentsUnitOfWork,
} from '../../application/transactions/incidents-unit-of-work';
import { PrismaIncidentHistoryRepository } from '../repositories/prisma-incident-history.repository';
import { PrismaIncidentsRepository } from '../repositories/prisma-incidents.repository';

@Injectable()
export class PrismaIncidentsUnitOfWork implements IncidentsUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  execute<TResult>(
    handler: (context: IncidentsTransactionContext) => Promise<TResult>,
  ): Promise<TResult> {
    return this.prisma.$transaction((transaction) =>
      handler({
        incidentsRepository: new PrismaIncidentsRepository(transaction),
        incidentHistoryRepository: new PrismaIncidentHistoryRepository(transaction),
      }),
    );
  }
}
