import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { Incident } from '../../domain/entities/incident.entity';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';
import { GetIncidentByIdUseCase } from './get-incident-by-id.use-case';

const now = new Date('2026-06-29T12:00:00.000Z');
const incidentId = '8d843a6e-8929-44a8-8ccb-41c52773f6b1';
const assigneeId = '356b57c6-9b8a-4576-8df6-cbd9799d8295';

function makeIncident(deletedAt: Date | null = null): Incident {
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
    deletedAt,
  });
}

function makeIncidentsRepository(incident: Incident | null): IncidentsRepository {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(incident),
    findMany: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
}

describe('GetIncidentByIdUseCase', () => {
  it('gets an active incident by id', async () => {
    const incidentsRepository = makeIncidentsRepository(makeIncident());
    const useCase = new GetIncidentByIdUseCase(incidentsRepository);

    await expect(
      useCase.execute({
        id: incidentId,
      }),
    ).resolves.toEqual({
      id: incidentId,
      title: 'VPN unavailable',
      description: 'Users cannot connect to the VPN gateway.',
      category: IncidentCategory.NETWORK,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.OPEN,
      assigneeId,
      createdAt: '2026-06-29T12:00:00.000Z',
      updatedAt: '2026-06-29T12:00:00.000Z',
      resolvedAt: null,
    });
    expect(incidentsRepository.findById).toHaveBeenCalledWith(incidentId);
  });

  it('throws ResourceNotFoundError when incident is not found', async () => {
    const incidentsRepository = makeIncidentsRepository(null);
    const useCase = new GetIncidentByIdUseCase(incidentsRepository);

    await expect(
      useCase.execute({
        id: incidentId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
