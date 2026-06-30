import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import {
  IncidentHistoryOutput,
  toIncidentHistoryOutput,
} from '../dtos/incident-history-output';
import { IncidentHistoryRepository } from '../../domain/repositories/incident-history.repository';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';

export type GetIncidentHistoryInput = {
  incidentId: string;
};

export class GetIncidentHistoryUseCase {
  constructor(
    private readonly incidentsRepository: IncidentsRepository,
    private readonly incidentHistoryRepository: IncidentHistoryRepository,
  ) {}

  async execute(
    input: GetIncidentHistoryInput,
  ): Promise<IncidentHistoryOutput[]> {
    const incident = await this.incidentsRepository.findById(input.incidentId);

    if (!incident) {
      throw new ResourceNotFoundError('Incident not found');
    }

    const history = await this.incidentHistoryRepository.findManyByIncidentId({
      incidentId: input.incidentId,
    });

    return history.map(toIncidentHistoryOutput);
  }
}
