import { FixedClock } from '../../../../shared/application/clock/fixed-clock';
import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { Incident } from '../../domain/entities/incident.entity';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';
import { DeleteIncidentUseCase } from './delete-incident.use-case';

const now = new Date('2026-06-29T12:00:00.000Z');
const deletedAt = new Date('2026-06-29T13:00:00.000Z');
const incidentId = '8d843a6e-8929-44a8-8ccb-41c52773f6b1';
const assigneeId = '356b57c6-9b8a-4576-8df6-cbd9799d8295';

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

function makeRepository(incident: Incident | null = makeIncident()): IncidentsRepository {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(incident),
    findMany: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockImplementation(async (deletedIncident: Incident) => deletedIncident),
  };
}

describe('DeleteIncidentUseCase', () => {
  it('soft deletes an incident through the repository', async () => {
    const repository = makeRepository();
    const useCase = new DeleteIncidentUseCase(
      repository,
      new FixedClock(deletedAt),
    );

    await expect(
      useCase.execute({
        id: incidentId,
      }),
    ).resolves.toBeUndefined();

    expect(repository.findById).toHaveBeenCalledWith(incidentId);
    expect(repository.softDelete).toHaveBeenCalledWith(expect.any(Incident));

    const deletedIncident = (repository.softDelete as jest.Mock).mock
      .calls[0][0] as Incident;
    expect(deletedIncident.deletedAt).toEqual(deletedAt);
    expect(deletedIncident.updatedAt).toEqual(deletedAt);
  });

  it('throws ResourceNotFoundError when incident is not found', async () => {
    const repository = makeRepository(null);
    const useCase = new DeleteIncidentUseCase(
      repository,
      new FixedClock(deletedAt),
    );

    await expect(
      useCase.execute({
        id: incidentId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });
});
