import { FixedClock } from '../../../../shared/application/clock/fixed-clock';
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
} from '../../../../shared/application/errors/application.error';
import { IdGenerator } from '../../../../shared/application/ids/id-generator';
import { User } from '../../../users/domain/entities/user.entity';
import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';
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
import { UpdateIncidentUseCase } from './update-incident.use-case';

const now = new Date('2026-06-29T12:00:00.000Z');
const changedAt = new Date('2026-06-29T13:00:00.000Z');
const incidentId = '8d843a6e-8929-44a8-8ccb-41c52773f6b1';
const assigneeId = '356b57c6-9b8a-4576-8df6-cbd9799d8295';
const newAssigneeId = 'd1694df5-f0db-47d5-9d8e-889ad5ac73a0';
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

function makeAssignee(id = newAssigneeId): User {
  return User.create({
    id,
    name: 'HIT User',
    email: `${id}@hit.local`,
    passwordHash: 'argon2id-hash',
    role: UserRole.USER,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
}

function makeUsersRepository(assignee: User | null = makeAssignee()): UsersRepository {
  return {
    create: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn().mockResolvedValue(assignee),
    findByEmail: jest.fn(),
    findByEmailIncludingDeleted: jest.fn(),
  };
}

function makeIdGenerator(): IdGenerator {
  return {
    generate: jest
      .fn()
      .mockReturnValueOnce('9681cfe6-ed3b-463d-a868-e9a38bd8cff9')
      .mockReturnValueOnce('e8e65462-e73e-4a77-baa9-364a063fdc40')
      .mockReturnValueOnce('b1f80677-41db-4605-9a64-3cdfd5fb2c02')
      .mockReturnValueOnce('ba06f019-cd99-4120-a18d-fd944f35b31f')
      .mockReturnValueOnce('bf82f468-75ef-4e7e-9496-faa813489c2a'),
  };
}

function makeTransactionContext(incident: Incident | null = makeIncident()) {
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
      ) =>
        handler({ incidentsRepository, incidentHistoryRepository }),
      ),
  };

  return {
    incidentsRepository,
    incidentHistoryRepository,
    incidentsUnitOfWork,
  };
}

describe('UpdateIncidentUseCase', () => {
  it('updates an incident and records field-level history in one unit of work', async () => {
    const context = makeTransactionContext();
    const usersRepository = makeUsersRepository();
    const useCase = new UpdateIncidentUseCase(
      context.incidentsUnitOfWork,
      usersRepository,
      makeIdGenerator(),
      new FixedClock(changedAt),
    );

    await expect(
      useCase.execute({
        id: incidentId,
        title: 'VPN degraded',
        description: 'VPN access is unstable for remote users.',
        priority: IncidentPriority.CRITICAL,
        assigneeId: newAssigneeId,
        status: IncidentStatus.IN_PROGRESS,
        changedById,
      }),
    ).resolves.toEqual({
      id: incidentId,
      title: 'VPN degraded',
      description: 'VPN access is unstable for remote users.',
      category: IncidentCategory.NETWORK,
      priority: IncidentPriority.CRITICAL,
      status: IncidentStatus.IN_PROGRESS,
      assigneeId: newAssigneeId,
      createdAt: '2026-06-29T12:00:00.000Z',
      updatedAt: '2026-06-29T13:00:00.000Z',
      resolvedAt: null,
    });
    expect(usersRepository.findById).toHaveBeenCalledWith(newAssigneeId);
    expect(context.incidentsUnitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(context.incidentsRepository.update).toHaveBeenCalledWith(
      expect.any(Incident),
    );
    expect(context.incidentHistoryRepository.createMany).toHaveBeenCalledWith([
      expectHistory('title', 'VPN unavailable', 'VPN degraded'),
      expectHistory(
        'description',
        'Users cannot connect to the VPN gateway.',
        'VPN access is unstable for remote users.',
      ),
      expectHistory('priority', IncidentPriority.HIGH, IncidentPriority.CRITICAL),
      expectHistory('assigneeId', assigneeId, newAssigneeId),
      expectHistory('status', IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS),
    ]);
  });

  it('returns the incident without persisting when there are no actual changes', async () => {
    const context = makeTransactionContext();
    const useCase = new UpdateIncidentUseCase(
      context.incidentsUnitOfWork,
      makeUsersRepository(makeAssignee(assigneeId)),
      makeIdGenerator(),
      new FixedClock(changedAt),
    );

    await expect(
      useCase.execute({
        id: incidentId,
        title: 'VPN unavailable',
        description: 'Users cannot connect to the VPN gateway.',
        priority: IncidentPriority.HIGH,
        assigneeId,
        status: IncidentStatus.OPEN,
        changedById,
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
    expect(context.incidentsRepository.update).not.toHaveBeenCalled();
    expect(context.incidentHistoryRepository.createMany).not.toHaveBeenCalled();
  });

  it('throws ResourceNotFoundError when incident is not found', async () => {
    const context = makeTransactionContext(null);
    const useCase = new UpdateIncidentUseCase(
      context.incidentsUnitOfWork,
      makeUsersRepository(),
      makeIdGenerator(),
      new FixedClock(changedAt),
    );

    await expect(
      useCase.execute({
        id: incidentId,
        title: 'VPN degraded',
        changedById,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
    expect(context.incidentsRepository.update).not.toHaveBeenCalled();
    expect(context.incidentHistoryRepository.createMany).not.toHaveBeenCalled();
  });

  it('throws ResourceNotFoundError when assignee does not exist', async () => {
    const context = makeTransactionContext();
    const useCase = new UpdateIncidentUseCase(
      context.incidentsUnitOfWork,
      makeUsersRepository(null),
      makeIdGenerator(),
      new FixedClock(changedAt),
    );

    await expect(
      useCase.execute({
        id: incidentId,
        assigneeId: newAssigneeId,
        changedById,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
    expect(context.incidentsUnitOfWork.execute).not.toHaveBeenCalled();
  });

  it('throws BusinessRuleViolationError when incident is already resolved', async () => {
    const context = makeTransactionContext(makeIncident(IncidentStatus.RESOLVED));
    const useCase = new UpdateIncidentUseCase(
      context.incidentsUnitOfWork,
      makeUsersRepository(),
      makeIdGenerator(),
      new FixedClock(changedAt),
    );

    await expect(
      useCase.execute({
        id: incidentId,
        title: 'VPN degraded',
        changedById,
      }),
    ).rejects.toThrow(BusinessRuleViolationError);
    expect(context.incidentsRepository.update).not.toHaveBeenCalled();
    expect(context.incidentHistoryRepository.createMany).not.toHaveBeenCalled();
  });

  it('throws BusinessRuleViolationError when status is RESOLVED', async () => {
    const context = makeTransactionContext();
    const useCase = new UpdateIncidentUseCase(
      context.incidentsUnitOfWork,
      makeUsersRepository(),
      makeIdGenerator(),
      new FixedClock(changedAt),
    );

    await expect(
      useCase.execute({
        id: incidentId,
        status: IncidentStatus.RESOLVED as never,
        changedById,
      }),
    ).rejects.toThrow(BusinessRuleViolationError);
    expect(context.incidentsUnitOfWork.execute).not.toHaveBeenCalled();
  });
});

function expectHistory(
  field: string,
  oldValue: string,
  newValue: string,
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
