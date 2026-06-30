import { ValidationError } from '../../../../shared/application/errors/application.error';
import { Incident } from '../../domain/entities/incident.entity';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';
import { ListIncidentsUseCase } from './list-incidents.use-case';

const now = new Date('2026-06-29T12:00:00.000Z');
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

function makeIncidentsRepository(): IncidentsRepository {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn().mockResolvedValue({
      incidents: [makeIncident()],
      total: 11,
    }),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
}

describe('ListIncidentsUseCase', () => {
  it('lists incidents with filters and pagination envelope', async () => {
    const incidentsRepository = makeIncidentsRepository();
    const useCase = new ListIncidentsUseCase(incidentsRepository);
    const createdFrom = new Date('2026-06-01T00:00:00.000Z');
    const createdTo = new Date('2026-06-30T23:59:59.000Z');
    const resolvedFrom = new Date('2026-06-10T00:00:00.000Z');
    const resolvedTo = new Date('2026-06-29T23:59:59.000Z');

    await expect(
      useCase.execute({
        page: 2,
        limit: 10,
        status: IncidentStatus.OPEN,
        priority: IncidentPriority.HIGH,
        category: IncidentCategory.NETWORK,
        assigneeId,
        createdFrom,
        createdTo,
        resolvedFrom,
        resolvedTo,
      }),
    ).resolves.toEqual({
      data: [
        {
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
        },
      ],
      meta: {
        page: 2,
        limit: 10,
        total: 11,
        totalPages: 2,
      },
    });
    expect(incidentsRepository.findMany).toHaveBeenCalledWith({
      filters: {
        status: IncidentStatus.OPEN,
        priority: IncidentPriority.HIGH,
        category: IncidentCategory.NETWORK,
        assigneeId,
        createdFrom,
        createdTo,
        resolvedFrom,
        resolvedTo,
      },
      pagination: {
        page: 2,
        limit: 10,
        offset: 10,
      },
    });
  });

  it('uses default pagination when params are absent', async () => {
    const incidentsRepository = makeIncidentsRepository();
    const useCase = new ListIncidentsUseCase(incidentsRepository);

    await useCase.execute();

    expect(incidentsRepository.findMany).toHaveBeenCalledWith({
      filters: {
        status: undefined,
        priority: undefined,
        category: undefined,
        assigneeId: undefined,
        createdFrom: undefined,
        createdTo: undefined,
        resolvedFrom: undefined,
        resolvedTo: undefined,
      },
      pagination: {
        page: 1,
        limit: 10,
        offset: 0,
      },
    });
  });

  it('throws ValidationError when pagination is invalid', async () => {
    const incidentsRepository = makeIncidentsRepository();
    const useCase = new ListIncidentsUseCase(incidentsRepository);

    await expect(
      useCase.execute({
        page: 0,
        limit: 101,
      }),
    ).rejects.toThrow(ValidationError);
    expect(incidentsRepository.findMany).not.toHaveBeenCalled();
  });
});
