import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infra/prisma/prisma.module';
import {
  INCIDENTS_UNIT_OF_WORK,
} from './application/transactions/incidents-unit-of-work';
import {
  INCIDENT_HISTORY_REPOSITORY,
} from './domain/repositories/incident-history.repository';
import {
  INCIDENTS_REPOSITORY,
} from './domain/repositories/incidents.repository';
import { PrismaIncidentHistoryRepository } from './infra/repositories/prisma-incident-history.repository';
import { PrismaIncidentsRepository } from './infra/repositories/prisma-incidents.repository';
import { PrismaIncidentsUnitOfWork } from './infra/transactions/prisma-incidents-unit-of-work';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaIncidentsRepository,
    PrismaIncidentHistoryRepository,
    PrismaIncidentsUnitOfWork,
    {
      provide: INCIDENTS_REPOSITORY,
      useExisting: PrismaIncidentsRepository,
    },
    {
      provide: INCIDENT_HISTORY_REPOSITORY,
      useExisting: PrismaIncidentHistoryRepository,
    },
    {
      provide: INCIDENTS_UNIT_OF_WORK,
      useExisting: PrismaIncidentsUnitOfWork,
    },
  ],
  exports: [
    INCIDENTS_REPOSITORY,
    INCIDENT_HISTORY_REPOSITORY,
    INCIDENTS_UNIT_OF_WORK,
  ],
})
export class IncidentsModule {}
