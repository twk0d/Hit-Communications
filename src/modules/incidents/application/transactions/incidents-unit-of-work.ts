import { UnitOfWork } from '../../../../shared/application/transactions/unit-of-work';
import { IncidentHistoryRepository } from '../../domain/repositories/incident-history.repository';
import { IncidentsRepository } from '../../domain/repositories/incidents.repository';

export const INCIDENTS_UNIT_OF_WORK = Symbol('INCIDENTS_UNIT_OF_WORK');

export type IncidentsTransactionContext = {
  incidentsRepository: IncidentsRepository;
  incidentHistoryRepository: IncidentHistoryRepository;
};

/**
 * Transaction boundary for flows that must persist incident changes and history atomically.
 */
export type IncidentsUnitOfWork = UnitOfWork<IncidentsTransactionContext>;
