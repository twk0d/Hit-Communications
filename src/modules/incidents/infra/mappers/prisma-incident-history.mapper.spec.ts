import { IncidentHistory } from '../../domain/entities/incident-history.entity';
import { PrismaIncidentHistoryMapper } from './prisma-incident-history.mapper';

const prismaHistory = {
  id: '9681cfe6-ed3b-463d-a868-e9a38bd8cff9',
  incidentId: '8d843a6e-8929-44a8-8ccb-41c52773f6b1',
  field: 'status',
  oldValue: 'OPEN',
  newValue: 'IN_PROGRESS',
  changedById: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  changedAt: new Date('2026-06-29T13:00:00.000Z'),
};

describe('PrismaIncidentHistoryMapper', () => {
  it('maps Prisma history model to domain audit record', () => {
    const history = PrismaIncidentHistoryMapper.toDomain(prismaHistory);

    expect(history.toSnapshot()).toEqual(prismaHistory);
  });

  it('maps domain audit record to persistence data', () => {
    const history = IncidentHistory.create(prismaHistory);

    expect(PrismaIncidentHistoryMapper.toPersistence(history)).toEqual(
      prismaHistory,
    );
  });
});
