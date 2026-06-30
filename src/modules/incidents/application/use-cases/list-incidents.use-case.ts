import {
  PaginatedResult,
  createPaginatedResult,
  normalizePaginationParams,
} from '../../../../shared/application/pagination/pagination';
import { IncidentOutput, toIncidentOutput } from '../dtos/incident-output';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';

export type ListIncidentsInput = {
  page?: number;
  limit?: number;
  status?: IncidentStatus;
  priority?: IncidentPriority;
  category?: IncidentCategory;
  assigneeId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  resolvedFrom?: Date;
  resolvedTo?: Date;
};

export class ListIncidentsUseCase {
  constructor(private readonly incidentsRepository: IncidentsRepository) {}

  async execute(
    input: ListIncidentsInput = {},
  ): Promise<PaginatedResult<IncidentOutput>> {
    const pagination = normalizePaginationParams({
      page: input.page,
      limit: input.limit,
    });
    const result = await this.incidentsRepository.findMany({
      filters: {
        status: input.status,
        priority: input.priority,
        category: input.category,
        assigneeId: input.assigneeId,
        createdFrom: input.createdFrom,
        createdTo: input.createdTo,
        resolvedFrom: input.resolvedFrom,
        resolvedTo: input.resolvedTo,
      },
      pagination,
    });

    return createPaginatedResult(
      result.incidents.map(toIncidentOutput),
      result.total,
      pagination,
    );
  }
}
