import { BusinessRuleViolationError } from '../../../../shared/application/errors/application.error';
import { IncidentCategory } from '../enums/incident-category.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';
import { IncidentStatus } from '../enums/incident-status.enum';

export type IncidentProps = {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  assigneeId: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  deletedAt: Date | null;
};

export type CreateIncidentProps = Omit<
  IncidentProps,
  'status' | 'resolvedAt' | 'deletedAt'
> & {
  status?: IncidentStatus;
  resolvedAt?: Date | null;
  deletedAt?: Date | null;
};

export class Incident {
  private constructor(private readonly props: IncidentProps) {}

  static create(props: CreateIncidentProps): Incident {
    return new Incident({
      ...props,
      status: props.status ?? IncidentStatus.OPEN,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
      resolvedAt: props.resolvedAt ? new Date(props.resolvedAt) : null,
      deletedAt: props.deletedAt ? new Date(props.deletedAt) : null,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get category(): IncidentCategory {
    return this.props.category;
  }

  get priority(): IncidentPriority {
    return this.props.priority;
  }

  get status(): IncidentStatus {
    return this.props.status;
  }

  get assigneeId(): string {
    return this.props.assigneeId;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  get resolvedAt(): Date | null {
    return this.props.resolvedAt ? new Date(this.props.resolvedAt) : null;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ? new Date(this.props.deletedAt) : null;
  }

  updateDetails(params: { title?: string; description?: string }, now: Date): void {
    this.ensureCanBeUpdated();

    if (params.title !== undefined) {
      this.props.title = params.title;
    }

    if (params.description !== undefined) {
      this.props.description = params.description;
    }

    this.touch(now);
  }

  assignTo(assigneeId: string, now: Date): void {
    this.ensureCanBeUpdated();

    this.props.assigneeId = assigneeId;
    this.touch(now);
  }

  changePriority(priority: IncidentPriority, now: Date): void {
    this.ensureCanBeUpdated();

    this.props.priority = priority;
    this.touch(now);
  }

  changeStatus(status: Exclude<IncidentStatus, IncidentStatus.RESOLVED>, now: Date): void;
  changeStatus(status: IncidentStatus, now: Date): void {
    if (status === IncidentStatus.RESOLVED) {
      throw new BusinessRuleViolationError(
        'Incident resolution must use the dedicated resolve flow',
      );
    }

    this.ensureCanBeUpdated();

    this.props.status = status;
    this.touch(now);
  }

  resolve(now: Date): void {
    if (this.props.status === IncidentStatus.RESOLVED) {
      throw new BusinessRuleViolationError('Incident is already resolved');
    }

    this.props.status = IncidentStatus.RESOLVED;
    this.props.resolvedAt = new Date(now);
    this.touch(now);
  }

  softDelete(now: Date): void {
    this.props.deletedAt = new Date(now);
    this.touch(now);
  }

  toSnapshot(): IncidentProps {
    return {
      ...this.props,
      createdAt: new Date(this.props.createdAt),
      updatedAt: new Date(this.props.updatedAt),
      resolvedAt: this.props.resolvedAt ? new Date(this.props.resolvedAt) : null,
      deletedAt: this.props.deletedAt ? new Date(this.props.deletedAt) : null,
    };
  }

  private touch(now: Date): void {
    this.props.updatedAt = new Date(now);
  }

  private ensureCanBeUpdated(): void {
    if (this.props.status === IncidentStatus.RESOLVED) {
      throw new BusinessRuleViolationError('Resolved incident cannot be updated');
    }
  }
}
