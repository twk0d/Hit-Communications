import { Clock } from '../../../../shared/application/clock/clock';
import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { IdGenerator } from '../../../../shared/application/ids/id-generator';
import { IncidentOutput, toIncidentOutput } from '../dtos/incident-output';
import { IncidentsUnitOfWork } from '../transactions/incidents-unit-of-work';
import { IncidentHistory } from '../../domain/entities/incident-history.entity';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';

export type ResolveIncidentInput = {
  id: string;
  changedById: string;
};

export class ResolveIncidentUseCase {
  constructor(
    private readonly incidentsUnitOfWork: IncidentsUnitOfWork,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: ResolveIncidentInput): Promise<IncidentOutput> {
    return this.incidentsUnitOfWork.execute(
      async ({ incidentsRepository, incidentHistoryRepository }) => {
        const incident = await incidentsRepository.findById(input.id);

        if (!incident) {
          throw new ResourceNotFoundError('Incident not found');
        }

        const before = incident.toSnapshot();
        const now = this.clock.now();

        incident.resolve(now);

        const updatedIncident = await incidentsRepository.update(incident);
        await incidentHistoryRepository.createMany([
          IncidentHistory.create({
            id: this.idGenerator.generate(),
            incidentId: incident.id,
            field: 'status',
            oldValue: before.status,
            newValue: IncidentStatus.RESOLVED,
            changedById: input.changedById,
            changedAt: now,
          }),
          IncidentHistory.create({
            id: this.idGenerator.generate(),
            incidentId: incident.id,
            field: 'resolvedAt',
            oldValue: before.resolvedAt?.toISOString() ?? null,
            newValue: now.toISOString(),
            changedById: input.changedById,
            changedAt: now,
          }),
        ]);

        return toIncidentOutput(updatedIncident);
      },
    );
  }
}
