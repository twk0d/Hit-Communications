import { FixedClock } from '../../../../shared/application/clock/fixed-clock';
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
} from '../../../../shared/application/errors/application.error';
import { IdGenerator } from '../../../../shared/application/ids/id-generator';
import {
  IncidentsTransactionContext,
  IncidentsUnitOfWork,
} from '../transactions/incidents-unit-of-work';
import { IncidentHistory } from '../../domain/entities/incident-history.entity';
import { Incident } from '../../domain/entities/incident.entity';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { IncidentHistoryRepository } from '../../domain/repositories/incident-history.repository';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';
import { ResolveIncidentUseCase } from './resolve-incident.use-case';

const now = new Date('2026-06-29T12:00:00.000Z');
const changedAt = new Date('2026-06-29T13:00:00.000Z');
const incidentId = '8d843a6e-8929-44a8-8ccb-41c52773f6b1';
const assigneeId = '356b57c6-9b8a-4576-8df6-cbd9799d8295';
const changedById = 'cf859f02-e83f-4b78-8f5b-6944ca5fd38a';

function makeIncident(status = IncidentStatus.OPEN): Incident {
  return Incident.create({
    id: incidentId,
    title: 'VPN unavailable',
    description: 'Users cannot connect to the VPN gateway.',
    category: IncidentCategory.NETWORK,
    priority: IncidentPriority.HIGH,
    status,
    assigneeId,
    createdAt: now,
    updatedAt: now,
    resolvedAt: status === IncidentStatus.RESOLVED ? changedAt : null,
    deletedAt: null,
  });
}

function makeIdGenerator(): IdGenerator {
  return {
    generate: jest
      .fn()
      .mockReturnValueOnce('9681cfe6-ed3b-463d-a868-e9a38bd8cff9')
      .mockReturnValueOnce('e8e65462-e73e-4a77-baa9-364a063fdc40'),
  };
}

function makeTransactionContext(
  incident: Incident | null = makeIncident(),
) {
  const incidentsRepository: IncidentsRepository = {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(incident),
    findMany: jest.fn(),
    update: jest.fn().mockImplementation(async (updatedIncident: Incident) => updatedIncident),
    softDelete: jest.fn(),
  };
  const incidentHistoryRepository: IncidentHistoryRepository = {
    createMany: jest.fn().mockResolvedValue(undefined),
    findManyByIncidentId: jest.fn(),
  };
  const incidentsUnitOfWork: IncidentsUnitOfWork = {
    execute: jest
      .fn()
      .mockImplementation(async <TResult>(
        handler: (context: IncidentsTransactionContext) => Promise<TResult>,
      ) => handler({ incidentsRepository, incidentHistoryRepository })),
  };

  return {
    incidentsRepository,
    incidentHistoryRepository,
    incidentsUnitOfWork,
  };
}

describe('ResolveIncidentUseCase', () => {
  it('resolves an incident and records status and resolvedAt history in one unit of work', async () => {
    const context = makeTransactionContext();
    const useCase = new ResolveIncidentUseCase(
      context.incidentsUnitOfWork,
      makeIdGenerator(),
      new FixedClock(changedAt),
    );

    await expect(
      useCase.execute({
        id: incidentId,
        changedById,
      }),
    ).resolves.toEqual({
      id: incidentId,
      title: 'VPN unavailable',
      description: 'Users cannot connect to the VPN gateway.',
      category: IncidentCategory.NETWORK,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.RESOLVED,
      assigneeId,
      createdAt: '2026-06-29T12:00:00.000Z',
      updatedAt: '2026-06-29T13:00:00.000Z',
      resolvedAt: '2026-06-29T13:00:00.000Z',
    });
    expect(context.incidentsUnitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(context.incidentsRepository.update).toHaveBeenCalledWith(
      expect.any(Incident),
    );
    expect(context.incidentHistoryRepository.createMany).toHaveBeenCalledWith([
      expectHistory('status', IncidentStatus.OPEN, IncidentStatus.RESOLVED),
      expectHistory('resolvedAt', null, '2026-06-29T13:00:00.000Z'),
    ]);
  });

  it('throws ResourceNotFoundError when incident is not found', async () => {
    const context = makeTransactionContext(null);
    const useCase = new ResolveIncidentUseCase(
      context.incidentsUnitOfWork,
      makeIdGenerator(),
      new FixedClock(changedAt),
    );

    await expect(
      useCase.execute({
        id: incidentId,
        changedById,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
    expect(context.incidentsRepository.update).not.toHaveBeenCalled();
    expect(context.incidentHistoryRepository.createMany).not.toHaveBeenCalled();
  });

  it('throws BusinessRuleViolationError when incident is already resolved', async () => {
    const context = makeTransactionContext(makeIncident(IncidentStatus.RESOLVED));
    const useCase = new ResolveIncidentUseCase(
      context.incidentsUnitOfWork,
      makeIdGenerator(),
      new FixedClock(changedAt),
    );

    await expect(
      useCase.execute({
        id: incidentId,
        changedById,
      }),
    ).rejects.toThrow(BusinessRuleViolationError);
    expect(context.incidentsRepository.update).not.toHaveBeenCalled();
    expect(context.incidentHistoryRepository.createMany).not.toHaveBeenCalled();
  });
});

function expectHistory(
  field: string,
  oldValue: string | null,
  newValue: string | null,
): IncidentHistory {
  return expect.objectContaining({
    field,
    oldValue,
    newValue,
    incidentId,
    changedById,
    changedAt,
  }) as unknown as IncidentHistory;
}
