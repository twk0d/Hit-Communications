import { Clock } from '../../../../shared/application/clock/clock';
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
} from '../../../../shared/application/errors/application.error';
import { IdGenerator } from '../../../../shared/application/ids/id-generator';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';
import { IncidentOutput, toIncidentOutput } from '../dtos/incident-output';
import { IncidentsUnitOfWork } from '../transactions/incidents-unit-of-work';
import { IncidentHistory } from '../../domain/entities/incident-history.entity';
import { Incident } from '../../domain/entities/incident.entity';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';

export type UpdatableIncidentStatus = Exclude<
  IncidentStatus,
  IncidentStatus.RESOLVED
>;

export type UpdateIncidentInput = {
  id: string;
  title?: string;
  description?: string;
  priority?: IncidentPriority;
  assigneeId?: string;
  status?: UpdatableIncidentStatus;
  changedById: string;
};

type IncidentChange = {
  field: string;
  oldValue: string | null;
  newValue: string | null;
};

export class UpdateIncidentUseCase {
  constructor(
    private readonly incidentsUnitOfWork: IncidentsUnitOfWork,
    private readonly usersRepository: UsersRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateIncidentInput): Promise<IncidentOutput> {
    const requestedStatus = input.status as IncidentStatus | undefined;

    if (requestedStatus === IncidentStatus.RESOLVED) {
      throw new BusinessRuleViolationError(
        'Incident resolution must use the dedicated resolve flow',
      );
    }

    if (input.assigneeId) {
      const assignee = await this.usersRepository.findById(input.assigneeId);

      if (!assignee) {
        throw new ResourceNotFoundError('Assignee not found');
      }
    }

    return this.incidentsUnitOfWork.execute(
      async ({ incidentsRepository, incidentHistoryRepository }) => {
        const incident = await incidentsRepository.findById(input.id);

        if (!incident) {
          throw new ResourceNotFoundError('Incident not found');
        }

        const now = this.clock.now();
        const changes = applyIncidentUpdates(incident, input, now);

        if (changes.length === 0) {
          return toIncidentOutput(incident);
        }

        const updatedIncident = await incidentsRepository.update(incident);
        await incidentHistoryRepository.createMany(
          changes.map((change) =>
            IncidentHistory.create({
              id: this.idGenerator.generate(),
              incidentId: incident.id,
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              changedById: input.changedById,
              changedAt: now,
            }),
          ),
        );

        return toIncidentOutput(updatedIncident);
      },
    );
  }
}

function applyIncidentUpdates(
  incident: Incident,
  input: UpdateIncidentInput,
  now: Date,
): IncidentChange[] {
  const before = incident.toSnapshot();
  const changes: IncidentChange[] = [];
  const details: { title?: string; description?: string } = {};

  if (input.title !== undefined && input.title !== before.title) {
    details.title = input.title;
    changes.push({
      field: 'title',
      oldValue: before.title,
      newValue: input.title,
    });
  }

  if (
    input.description !== undefined &&
    input.description !== before.description
  ) {
    details.description = input.description;
    changes.push({
      field: 'description',
      oldValue: before.description,
      newValue: input.description,
    });
  }

  if (details.title !== undefined || details.description !== undefined) {
    incident.updateDetails(details, now);
  }

  if (input.priority !== undefined && input.priority !== before.priority) {
    incident.changePriority(input.priority, now);
    changes.push({
      field: 'priority',
      oldValue: before.priority,
      newValue: input.priority,
    });
  }

  if (input.assigneeId !== undefined && input.assigneeId !== before.assigneeId) {
    incident.assignTo(input.assigneeId, now);
    changes.push({
      field: 'assigneeId',
      oldValue: before.assigneeId,
      newValue: input.assigneeId,
    });
  }

  if (input.status !== undefined && input.status !== before.status) {
    incident.changeStatus(input.status, now);
    changes.push({
      field: 'status',
      oldValue: before.status,
      newValue: input.status,
    });
  }

  return changes;
}
