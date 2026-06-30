import { Incident } from '../../domain/entities/incident.entity';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';

export type IncidentOutput = {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  assigneeId: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export function toIncidentOutput(incident: Incident): IncidentOutput {
  const snapshot = incident.toSnapshot();

  return {
    id: snapshot.id,
    title: snapshot.title,
    description: snapshot.description,
    category: snapshot.category,
    priority: snapshot.priority,
    status: snapshot.status,
    assigneeId: snapshot.assigneeId,
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString(),
    resolvedAt: snapshot.resolvedAt?.toISOString() ?? null,
  };
}
