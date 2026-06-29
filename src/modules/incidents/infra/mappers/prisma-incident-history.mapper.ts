import { IncidentHistory as PrismaIncidentHistoryModel } from '@prisma/client';

import {
  IncidentHistory,
  IncidentHistoryProps,
} from '../../domain/entities/incident-history.entity';

type PrismaIncidentHistoryPersistence = PrismaIncidentHistoryModel;

export class PrismaIncidentHistoryMapper {
  static toDomain(history: PrismaIncidentHistoryPersistence): IncidentHistory {
    return IncidentHistory.create({
      id: history.id,
      incidentId: history.incidentId,
      field: history.field,
      oldValue: history.oldValue,
      newValue: history.newValue,
      changedById: history.changedById,
      changedAt: history.changedAt,
    });
  }

  static toPersistence(
    history: IncidentHistory,
  ): PrismaIncidentHistoryPersistence {
    const snapshot: IncidentHistoryProps = history.toSnapshot();

    return {
      id: snapshot.id,
      incidentId: snapshot.incidentId,
      field: snapshot.field,
      oldValue: snapshot.oldValue,
      newValue: snapshot.newValue,
      changedById: snapshot.changedById,
      changedAt: snapshot.changedAt,
    };
  }
}
