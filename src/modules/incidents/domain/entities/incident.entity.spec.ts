import { BusinessRuleViolationError } from '../../../../shared/application/errors/application.error';
import { Incident } from './incident.entity';
import { IncidentPriority } from '../enums/incident-priority.enum';
import { IncidentCategory } from '../enums/incident-category.enum';
import { IncidentStatus } from '../enums/incident-status.enum';

const baseDate = new Date('2026-06-29T12:00:00.000Z');

function makeIncident(): Incident {
  return Incident.create({
    id: '1b81f0a5-5d33-44e1-9c20-7d1f8a6f20b0',
    title: 'VPN unavailable',
    description: 'Users cannot access the VPN service.',
    category: IncidentCategory.NETWORK,
    priority: IncidentPriority.HIGH,
    assigneeId: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
    createdAt: baseDate,
    updatedAt: baseDate,
  });
}

describe('Incident', () => {
  it('creates an incident with OPEN status by default', () => {
    const incident = makeIncident();

    expect(incident.status).toBe(IncidentStatus.OPEN);
    expect(incident.resolvedAt).toBeNull();
    expect(incident.deletedAt).toBeNull();
  });

  it('updates details and tracks updatedAt', () => {
    const incident = makeIncident();
    const updatedAt = new Date('2026-06-29T13:00:00.000Z');

    incident.updateDetails(
      {
        title: 'VPN intermittently unavailable',
        description: 'Users report intermittent VPN access.',
      },
      updatedAt,
    );

    expect(incident.title).toBe('VPN intermittently unavailable');
    expect(incident.description).toBe('Users report intermittent VPN access.');
    expect(incident.updatedAt).toEqual(updatedAt);
  });

  it('allows changing status to an allowed non-resolved status', () => {
    const incident = makeIncident();

    incident.changeStatus(IncidentStatus.IN_PROGRESS, new Date('2026-06-29T13:00:00.000Z'));

    expect(incident.status).toBe(IncidentStatus.IN_PROGRESS);
  });

  it('blocks generic status change to RESOLVED', () => {
    const incident = makeIncident();

    expect(() =>
      (incident as unknown as { changeStatus(status: IncidentStatus, now: Date): void }).changeStatus(
        IncidentStatus.RESOLVED,
        new Date('2026-06-29T13:00:00.000Z'),
      ),
    ).toThrow(BusinessRuleViolationError);
  });

  it('resolves incident with resolvedAt and updatedAt', () => {
    const incident = makeIncident();
    const resolvedAt = new Date('2026-06-29T14:00:00.000Z');

    incident.resolve(resolvedAt);

    expect(incident.status).toBe(IncidentStatus.RESOLVED);
    expect(incident.resolvedAt).toEqual(resolvedAt);
    expect(incident.updatedAt).toEqual(resolvedAt);
  });

  it('rejects resolving an already resolved incident', () => {
    const incident = makeIncident();
    incident.resolve(new Date('2026-06-29T14:00:00.000Z'));

    expect(() => incident.resolve(new Date('2026-06-29T15:00:00.000Z'))).toThrow(
      BusinessRuleViolationError,
    );
  });

  it('soft deletes incident with deletedAt and updatedAt', () => {
    const incident = makeIncident();
    const deletedAt = new Date('2026-06-29T16:00:00.000Z');

    incident.softDelete(deletedAt);

    expect(incident.deletedAt).toEqual(deletedAt);
    expect(incident.updatedAt).toEqual(deletedAt);
  });
});
