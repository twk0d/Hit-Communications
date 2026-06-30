import { Clock } from '../../../../shared/application/clock/clock';
import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';

export type DeleteIncidentInput = {
  id: string;
};

export class DeleteIncidentUseCase {
  constructor(
    private readonly incidentsRepository: IncidentsRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: DeleteIncidentInput): Promise<void> {
    const incident = await this.incidentsRepository.findById(input.id);

    if (!incident) {
      throw new ResourceNotFoundError('Incident not found');
    }

    incident.softDelete(this.clock.now());

    await this.incidentsRepository.softDelete(incident);
  }
}
