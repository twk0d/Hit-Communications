export type IncidentHistoryProps = {
  id: string;
  incidentId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedById: string;
  changedAt: Date;
};

export class IncidentHistory {
  private readonly props: IncidentHistoryProps;

  private constructor(props: IncidentHistoryProps) {
    this.props = props;
  }

  static create(props: IncidentHistoryProps): IncidentHistory {
    return new IncidentHistory({
      ...props,
      changedAt: new Date(props.changedAt),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get incidentId(): string {
    return this.props.incidentId;
  }

  get field(): string {
    return this.props.field;
  }

  get oldValue(): string | null {
    return this.props.oldValue;
  }

  get newValue(): string | null {
    return this.props.newValue;
  }

  get changedById(): string {
    return this.props.changedById;
  }

  get changedAt(): Date {
    return new Date(this.props.changedAt);
  }

  toSnapshot(): IncidentHistoryProps {
    return {
      ...this.props,
      changedAt: new Date(this.props.changedAt),
    };
  }
}
