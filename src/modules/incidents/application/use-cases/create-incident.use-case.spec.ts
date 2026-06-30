import { FixedClock } from '../../../../shared/application/clock/fixed-clock';
import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { IdGenerator } from '../../../../shared/application/ids/id-generator';
import { User } from '../../../users/domain/entities/user.entity';
import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';
import { Incident } from '../../domain/entities/incident.entity';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';
import { CreateIncidentUseCase } from './create-incident.use-case';

const now = new Date('2026-06-29T12:00:00.000Z');
const incidentId = '8d843a6e-8929-44a8-8ccb-41c52773f6b1';
const assigneeId = '356b57c6-9b8a-4576-8df6-cbd9799d8295';

function makeIncidentsRepository(): IncidentsRepository {
  return {
    create: jest.fn().mockImplementation(async (incident: Incident) => incident),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
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
    generate: jest.fn().mockReturnValue(incidentId),
  };
}

function makeAssignee(): User {
  return User.create({
    id: assigneeId,
    name: 'HIT User',
    email: 'user@hit.local',
    passwordHash: 'argon2id-hash',
    role: UserRole.USER,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
}

describe('CreateIncidentUseCase', () => {
  it('creates an incident assigned to an existing user with OPEN status', async () => {
    const incidentsRepository = makeIncidentsRepository();
    const usersRepository = makeUsersRepository();
    const useCase = new CreateIncidentUseCase(
      incidentsRepository,
      usersRepository,
      makeIdGenerator(),
      new FixedClock(now),
    );

    await expect(
      useCase.execute({
        title: 'VPN unavailable',
        description: 'Users cannot connect to the VPN gateway.',
        category: IncidentCategory.NETWORK,
        priority: IncidentPriority.HIGH,
        assigneeId,
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
    expect(usersRepository.findById).toHaveBeenCalledWith(assigneeId);
    expect(incidentsRepository.create).toHaveBeenCalledWith(expect.any(Incident));
  });

  it('throws ResourceNotFoundError when assignee does not exist', async () => {
    const incidentsRepository = makeIncidentsRepository();
    const useCase = new CreateIncidentUseCase(
      incidentsRepository,
      makeUsersRepository(null),
      makeIdGenerator(),
      new FixedClock(now),
    );

    await expect(
      useCase.execute({
        title: 'VPN unavailable',
        description: 'Users cannot connect to the VPN gateway.',
        category: IncidentCategory.NETWORK,
        priority: IncidentPriority.HIGH,
        assigneeId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
    expect(incidentsRepository.create).not.toHaveBeenCalled();
  });
});
