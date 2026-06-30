import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { IncidentHistory } from '../../domain/entities/incident-history.entity';
import { Incident } from '../../domain/entities/incident.entity';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { IncidentHistoryRepository } from '../../domain/repositories/incident-history.repository';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';
import { GetIncidentHistoryUseCase } from './get-incident-history.use-case';

const now = new Date('2026-06-29T12:00:00.000Z');
const changedAt = new Date('2026-06-29T13:00:00.000Z');
const incidentId = '8d843a6e-8929-44a8-8ccb-41c52773f6b1';
const assigneeId = '356b57c6-9b8a-4576-8df6-cbd9799d8295';
const changedById = 'cf859f02-e83f-4b78-8f5b-6944ca5fd38a';

function makeIncident(): Incident {
  return Incident.create({
    id: incidentId,
    title: 'VPN unavailable',
    description: 'Users cannot connect to the VPN gateway.',
    category: IncidentCategory.NETWORK,
    priority: IncidentPriority.HIGH,
    status: IncidentStatus.OPEN,
    assigneeId,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    deletedAt: null,
  });
}

function makeHistory(): IncidentHistory {
  return IncidentHistory.create({
    id: '9681cfe6-ed3b-463d-a868-e9a38bd8cff9',
    incidentId,
    field: 'status',
    oldValue: IncidentStatus.OPEN,
    newValue: IncidentStatus.IN_PROGRESS,
    changedById,
    changedAt,
  });
}

function makeIncidentsRepository(
  incident: Incident | null = makeIncident(),
): IncidentsRepository {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(incident),
    findMany: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
}

function makeIncidentHistoryRepository(
  history: IncidentHistory[] = [makeHistory()],
): IncidentHistoryRepository {
  return {
    createMany: jest.fn(),
    findManyByIncidentId: jest.fn().mockResolvedValue(history),
  };
}

describe('GetIncidentHistoryUseCase', () => {
  it('returns incident history converted to API output', async () => {
    const incidentsRepository = makeIncidentsRepository();
    const incidentHistoryRepository = makeIncidentHistoryRepository();
    const useCase = new GetIncidentHistoryUseCase(
      incidentsRepository,
      incidentHistoryRepository,
    );

    await expect(
      useCase.execute({
        incidentId,
      }),
    ).resolves.toEqual([
      {
        id: '9681cfe6-ed3b-463d-a868-e9a38bd8cff9',
        incidentId,
        field: 'status',
        oldValue: IncidentStatus.OPEN,
        newValue: IncidentStatus.IN_PROGRESS,
        changedById,
        changedAt: '2026-06-29T13:00:00.000Z',
      },
    ]);
    expect(incidentsRepository.findById).toHaveBeenCalledWith(incidentId);
    expect(incidentHistoryRepository.findManyByIncidentId).toHaveBeenCalledWith(
      {
        incidentId,
      },
    );
  });

  it('throws ResourceNotFoundError when incident is not found', async () => {
    const incidentsRepository = makeIncidentsRepository(null);
    const incidentHistoryRepository = makeIncidentHistoryRepository();
    const useCase = new GetIncidentHistoryUseCase(
      incidentsRepository,
      incidentHistoryRepository,
    );

    await expect(
      useCase.execute({
        incidentId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
    expect(incidentHistoryRepository.findManyByIncidentId).not.toHaveBeenCalled();
  });
});
