import { Clock } from '../../../../shared/application/clock/clock';
import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { IdGenerator } from '../../../../shared/application/ids/id-generator';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';
import { IncidentOutput, toIncidentOutput } from '../dtos/incident-output';
import { Incident } from '../../domain/entities/incident.entity';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';

export type CreateIncidentInput = {
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  assigneeId: string;
};

export class CreateIncidentUseCase {
  constructor(
    private readonly incidentsRepository: IncidentsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateIncidentInput): Promise<IncidentOutput> {
    const assignee = await this.usersRepository.findById(input.assigneeId);

    if (!assignee) {
      throw new ResourceNotFoundError('Assignee not found');
    }

    const now = this.clock.now();
    const incident = Incident.create({
      id: this.idGenerator.generate(),
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      assigneeId: input.assigneeId,
      createdAt: now,
      updatedAt: now,
    });

    const createdIncident = await this.incidentsRepository.create(incident);

    return toIncidentOutput(createdIncident);
  }
}
