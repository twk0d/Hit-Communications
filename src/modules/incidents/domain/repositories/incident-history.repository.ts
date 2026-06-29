import { IncidentHistory } from '../entities/incident-history.entity';

export const INCIDENT_HISTORY_REPOSITORY = Symbol('INCIDENT_HISTORY_REPOSITORY');

export type FindIncidentHistoryInput = {
  incidentId: string;
};

export interface IncidentHistoryRepository {
  /**
   * Mandatory history writes must run in the same Unit of Work as the incident update.
   */
  createMany(history: IncidentHistory[]): Promise<void>;

  /**
   * Default history query. Implementations must order by changedAt descending.
   */
  findManyByIncidentId(input: FindIncidentHistoryInput): Promise<IncidentHistory[]>;
}
