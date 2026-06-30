import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { IncidentOutput, toIncidentOutput } from '../dtos/incident-output';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';

export type GetIncidentByIdInput = {
  id: string;
};

export class GetIncidentByIdUseCase {
  constructor(private readonly incidentsRepository: IncidentsRepository) {}

  async execute(input: GetIncidentByIdInput): Promise<IncidentOutput> {
    const incident = await this.incidentsRepository.findById(input.id);

    if (!incident) {
      throw new ResourceNotFoundError('Incident not found');
    }

    return toIncidentOutput(incident);
  }
}
