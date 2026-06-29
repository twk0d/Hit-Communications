import { Incident } from '../entities/incident.entity';
import { IncidentCategory } from '../enums/incident-category.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';
import { IncidentStatus } from '../enums/incident-status.enum';

export const INCIDENTS_REPOSITORY = Symbol('INCIDENTS_REPOSITORY');

export type ListIncidentsFilters = {
  status?: IncidentStatus;
  priority?: IncidentPriority;
  category?: IncidentCategory;
  assigneeId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  resolvedFrom?: Date;
  resolvedTo?: Date;
};

export type IncidentListPagination = {
  page: number;
  limit: number;
  offset: number;
};

export type ListIncidentsInput = {
  filters?: ListIncidentsFilters;
  pagination: IncidentListPagination;
};

export type ListIncidentsResult = {
  incidents: Incident[];
  total: number;
};

export interface IncidentsRepository {
  create(incident: Incident): Promise<Incident>;

  /**
   * Default incident lookup. Implementations must ignore soft-deleted records.
   */
  findById(id: string): Promise<Incident | null>;

  /**
   * Default list query. Implementations must ignore soft-deleted records and
   * order by createdAt descending.
   */
  findMany(input: ListIncidentsInput): Promise<ListIncidentsResult>;

  update(incident: Incident): Promise<Incident>;

  /**
   * Persists an aggregate already marked as soft-deleted by Incident.softDelete.
   */
  softDelete(incident: Incident): Promise<Incident>;
}
