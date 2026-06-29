import { PrismaService } from '../../../../infra/prisma/prisma.service';

export type PrismaIncidentsClient = Pick<
  PrismaService,
  'incident' | 'incidentHistory'
>;
