import { IncidentHistory } from '../../domain/entities/incident-history.entity';

export type IncidentHistoryOutput = {
  id: string;
  incidentId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedById: string;
  changedAt: string;
};

export function toIncidentHistoryOutput(
  history: IncidentHistory,
): IncidentHistoryOutput {
  const snapshot = history.toSnapshot();

  return {
    id: snapshot.id,
    incidentId: snapshot.incidentId,
    field: snapshot.field,
    oldValue: snapshot.oldValue,
    newValue: snapshot.newValue,
    changedById: snapshot.changedById,
    changedAt: snapshot.changedAt.toISOString(),
  };
}
