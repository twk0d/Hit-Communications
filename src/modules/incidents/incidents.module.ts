import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infra/prisma/prisma.module';
import { CLOCK, Clock } from '../../shared/application/clock/clock';
import { ID_GENERATOR, IdGenerator } from '../../shared/application/ids/id-generator';
import { SystemClock } from '../../shared/infra/clock/system-clock';
import { RandomUuidGenerator } from '../../shared/infra/ids/random-uuid-generator';
import { JwtAuthGuard } from '../auth/infra/guards/jwt-auth.guard';
import { USERS_REPOSITORY, UsersRepository } from '../users/domain/repositories/users.repository';
import { UsersModule } from '../users/users.module';
import {
  INCIDENTS_UNIT_OF_WORK,
} from './application/transactions/incidents-unit-of-work';
import { CreateIncidentUseCase } from './application/use-cases/create-incident.use-case';
import { GetIncidentByIdUseCase } from './application/use-cases/get-incident-by-id.use-case';
import { ListIncidentsUseCase } from './application/use-cases/list-incidents.use-case';
import {
  INCIDENT_HISTORY_REPOSITORY,
} from './domain/repositories/incident-history.repository';
import {
  IncidentsRepository,
  INCIDENTS_REPOSITORY,
} from './domain/repositories/incidents.repository';
import { PrismaIncidentHistoryRepository } from './infra/repositories/prisma-incident-history.repository';
import { PrismaIncidentsRepository } from './infra/repositories/prisma-incidents.repository';
import { PrismaIncidentsUnitOfWork } from './infra/transactions/prisma-incidents-unit-of-work';
import { IncidentsController } from './presentation/controllers/incidents.controller';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [IncidentsController],
  providers: [
    JwtAuthGuard,
    {
      provide: ID_GENERATOR,
      useClass: RandomUuidGenerator,
    },
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
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
    {
      provide: CreateIncidentUseCase,
      inject: [INCIDENTS_REPOSITORY, USERS_REPOSITORY, ID_GENERATOR, CLOCK],
      useFactory: (
        incidentsRepository: IncidentsRepository,
        usersRepository: UsersRepository,
        idGenerator: IdGenerator,
        clock: Clock,
      ) =>
        new CreateIncidentUseCase(
          incidentsRepository,
          usersRepository,
          idGenerator,
          clock,
        ),
    },
    {
      provide: GetIncidentByIdUseCase,
      inject: [INCIDENTS_REPOSITORY],
      useFactory: (incidentsRepository: IncidentsRepository) =>
        new GetIncidentByIdUseCase(incidentsRepository),
    },
    {
      provide: ListIncidentsUseCase,
      inject: [INCIDENTS_REPOSITORY],
      useFactory: (incidentsRepository: IncidentsRepository) =>
        new ListIncidentsUseCase(incidentsRepository),
    },
  ],
  exports: [
    INCIDENTS_REPOSITORY,
    INCIDENT_HISTORY_REPOSITORY,
    INCIDENTS_UNIT_OF_WORK,
  ],
})
export class IncidentsModule {}
