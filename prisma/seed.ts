import {
  IncidentCategory,
  IncidentPriority,
  IncidentStatus,
  PrismaClient,
  User,
  UserRole,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const ADMIN_USER_ID = 'cf859f02-e83f-4b78-8f5b-6944ca5fd38a';
const STANDARD_USER_ID = '356b57c6-9b8a-4576-8df6-cbd9799d8295';

type SeedUserInput = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type DemoIncidentInput = {
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

type DemoHistoryInput = {
  id: string;
  incidentId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedById: string;
  changedAt: Date;
};

function date(value: string): Date {
  return new Date(value);
}

async function upsertUser(params: SeedUserInput): Promise<User> {
  const passwordHash = await argon2.hash(params.password, {
    type: argon2.argon2id,
  });

  const existingUser = await prisma.user.findUnique({
    where: {
      email: params.email,
    },
  });

  if (existingUser) {
    return prisma.user.update({
      where: {
        email: params.email,
      },
      data: {
        name: params.name,
        role: params.role,
        passwordHash,
        deletedAt: null,
      },
    });
  }

  return prisma.user.upsert({
    where: {
      id: params.id,
    },
    update: {
      name: params.name,
      email: params.email,
      role: params.role,
      passwordHash,
      deletedAt: null,
    },
    create: {
      id: params.id,
      name: params.name,
      email: params.email,
      role: params.role,
      passwordHash,
    },
  });
}

async function upsertIncident(incident: DemoIncidentInput): Promise<void> {
  await prisma.incident.upsert({
    where: {
      id: incident.id,
    },
    update: {
      title: incident.title,
      description: incident.description,
      category: incident.category,
      priority: incident.priority,
      status: incident.status,
      assigneeId: incident.assigneeId,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
      resolvedAt: incident.resolvedAt,
      deletedAt: incident.deletedAt,
    },
    create: incident,
  });
}

function buildDemoIncidents(params: {
  adminUserId: string;
  standardUserId: string;
}): DemoIncidentInput[] {
  const { adminUserId, standardUserId } = params;

  return [
    {
      id: '10000000-0000-4000-8000-000000000001',
      title: 'Authentication service latency',
      description: 'Authentication requests are slower than expected during peak usage.',
      category: IncidentCategory.SYSTEM,
      priority: IncidentPriority.LOW,
      status: IncidentStatus.OPEN,
      assigneeId: adminUserId,
      createdAt: date('2026-06-01T09:00:00.000Z'),
      updatedAt: date('2026-06-01T09:00:00.000Z'),
      resolvedAt: null,
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000002',
      title: 'VPN unavailable in branch office',
      description: 'Users in the south branch cannot establish VPN connections.',
      category: IncidentCategory.NETWORK,
      priority: IncidentPriority.MEDIUM,
      status: IncidentStatus.OPEN,
      assigneeId: standardUserId,
      createdAt: date('2026-06-02T10:15:00.000Z'),
      updatedAt: date('2026-06-02T10:15:00.000Z'),
      resolvedAt: null,
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000003',
      title: 'Storage capacity warning',
      description: 'Primary storage cluster reached the configured capacity warning threshold.',
      category: IncidentCategory.INFRASTRUCTURE,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.OPEN,
      assigneeId: adminUserId,
      createdAt: date('2026-06-03T11:30:00.000Z'),
      updatedAt: date('2026-06-03T11:30:00.000Z'),
      resolvedAt: null,
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000004',
      title: 'Legacy access request cleanup',
      description: 'Legacy access request was registered for cleanup validation only.',
      category: IncidentCategory.ACCESS,
      priority: IncidentPriority.CRITICAL,
      status: IncidentStatus.OPEN,
      assigneeId: standardUserId,
      createdAt: date('2026-06-04T12:45:00.000Z'),
      updatedAt: date('2026-06-20T08:00:00.000Z'),
      resolvedAt: null,
      deletedAt: date('2026-06-20T08:00:00.000Z'),
    },
    {
      id: '10000000-0000-4000-8000-000000000005',
      title: 'Data warehouse import delayed',
      description: 'Nightly data warehouse import is still processing after the expected window.',
      category: IncidentCategory.DATA,
      priority: IncidentPriority.LOW,
      status: IncidentStatus.IN_PROGRESS,
      assigneeId: adminUserId,
      createdAt: date('2026-06-05T08:20:00.000Z'),
      updatedAt: date('2026-06-05T09:05:00.000Z'),
      resolvedAt: null,
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000006',
      title: 'Invoice approval workflow paused',
      description:
        'Operational invoice approvals are waiting because the workflow queue is paused.',
      category: IncidentCategory.PROCESS,
      priority: IncidentPriority.MEDIUM,
      status: IncidentStatus.IN_PROGRESS,
      assigneeId: standardUserId,
      createdAt: date('2026-06-06T13:40:00.000Z'),
      updatedAt: date('2026-06-06T14:10:00.000Z'),
      resolvedAt: null,
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000007',
      title: 'Monitoring alerts missing',
      description:
        'Monitoring alerts are not being delivered to the operations notification channel.',
      category: IncidentCategory.SYSTEM,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.IN_PROGRESS,
      assigneeId: adminUserId,
      createdAt: date('2026-06-07T07:50:00.000Z'),
      updatedAt: date('2026-06-07T08:25:00.000Z'),
      resolvedAt: null,
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000008',
      title: 'Packet loss between datacenters',
      description:
        'Network monitoring detected intermittent packet loss between primary datacenters.',
      category: IncidentCategory.NETWORK,
      priority: IncidentPriority.CRITICAL,
      status: IncidentStatus.IN_PROGRESS,
      assigneeId: standardUserId,
      createdAt: date('2026-06-08T15:00:00.000Z'),
      updatedAt: date('2026-06-08T15:45:00.000Z'),
      resolvedAt: null,
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000009',
      title: 'Backup job recovered',
      description: 'The failed backup job was rerun successfully and verified by operations.',
      category: IncidentCategory.INFRASTRUCTURE,
      priority: IncidentPriority.LOW,
      status: IncidentStatus.RESOLVED,
      assigneeId: adminUserId,
      createdAt: date('2026-06-09T06:35:00.000Z'),
      updatedAt: date('2026-06-12T10:00:00.000Z'),
      resolvedAt: date('2026-06-12T10:00:00.000Z'),
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000010',
      title: 'Single sign-on restored',
      description: 'Single sign-on redirects were fixed after configuration was corrected.',
      category: IncidentCategory.ACCESS,
      priority: IncidentPriority.MEDIUM,
      status: IncidentStatus.RESOLVED,
      assigneeId: standardUserId,
      createdAt: date('2026-06-10T09:10:00.000Z'),
      updatedAt: date('2026-06-13T16:30:00.000Z'),
      resolvedAt: date('2026-06-13T16:30:00.000Z'),
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000011',
      title: 'Customer export corrected',
      description: 'Customer export file was regenerated after correcting invalid source records.',
      category: IncidentCategory.DATA,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.RESOLVED,
      assigneeId: adminUserId,
      createdAt: date('2026-06-11T18:25:00.000Z'),
      updatedAt: date('2026-06-18T11:20:00.000Z'),
      resolvedAt: date('2026-06-18T11:20:00.000Z'),
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000012',
      title: 'Dispatch process normalized',
      description:
        'Dispatch backlog was cleared after the queue worker configuration was adjusted.',
      category: IncidentCategory.PROCESS,
      priority: IncidentPriority.CRITICAL,
      status: IncidentStatus.RESOLVED,
      assigneeId: standardUserId,
      createdAt: date('2026-06-12T21:05:00.000Z'),
      updatedAt: date('2026-06-22T17:15:00.000Z'),
      resolvedAt: date('2026-06-22T17:15:00.000Z'),
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000013',
      title: 'Report scheduler canceled',
      description:
        'Scheduled report execution was canceled after the business request was withdrawn.',
      category: IncidentCategory.SYSTEM,
      priority: IncidentPriority.LOW,
      status: IncidentStatus.CANCELED,
      assigneeId: adminUserId,
      createdAt: date('2026-06-13T05:55:00.000Z'),
      updatedAt: date('2026-06-14T08:40:00.000Z'),
      resolvedAt: null,
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000014',
      title: 'Network change postponed',
      description:
        'Planned network change was canceled because the maintenance window was postponed.',
      category: IncidentCategory.NETWORK,
      priority: IncidentPriority.MEDIUM,
      status: IncidentStatus.CANCELED,
      assigneeId: standardUserId,
      createdAt: date('2026-06-14T16:10:00.000Z'),
      updatedAt: date('2026-06-15T09:30:00.000Z'),
      resolvedAt: null,
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000015',
      title: 'Server replacement canceled',
      description: 'Server replacement incident was canceled after hardware diagnostics passed.',
      category: IncidentCategory.INFRASTRUCTURE,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.CANCELED,
      assigneeId: adminUserId,
      createdAt: date('2026-06-15T22:00:00.000Z'),
      updatedAt: date('2026-06-16T10:35:00.000Z'),
      resolvedAt: null,
      deletedAt: null,
    },
    {
      id: '10000000-0000-4000-8000-000000000016',
      title: 'Temporary access cleanup',
      description: 'Temporary privileged access incident was removed after validation in staging.',
      category: IncidentCategory.ACCESS,
      priority: IncidentPriority.CRITICAL,
      status: IncidentStatus.CANCELED,
      assigneeId: standardUserId,
      createdAt: date('2026-06-16T19:45:00.000Z'),
      updatedAt: date('2026-06-24T12:00:00.000Z'),
      resolvedAt: null,
      deletedAt: date('2026-06-24T12:00:00.000Z'),
    },
  ];
}

function buildDemoHistory(params: {
  adminUserId: string;
  standardUserId: string;
}): DemoHistoryInput[] {
  const { adminUserId, standardUserId } = params;

  return [
    history(
      1,
      5,
      'status',
      IncidentStatus.OPEN,
      IncidentStatus.IN_PROGRESS,
      adminUserId,
      '2026-06-05T09:05:00.000Z',
    ),
    history(
      2,
      6,
      'assigneeId',
      adminUserId,
      standardUserId,
      adminUserId,
      '2026-06-06T13:55:00.000Z',
    ),
    history(
      3,
      6,
      'status',
      IncidentStatus.OPEN,
      IncidentStatus.IN_PROGRESS,
      standardUserId,
      '2026-06-06T14:10:00.000Z',
    ),
    history(
      4,
      7,
      'priority',
      IncidentPriority.MEDIUM,
      IncidentPriority.HIGH,
      adminUserId,
      '2026-06-07T08:10:00.000Z',
    ),
    history(
      5,
      7,
      'status',
      IncidentStatus.OPEN,
      IncidentStatus.IN_PROGRESS,
      adminUserId,
      '2026-06-07T08:25:00.000Z',
    ),
    history(
      6,
      8,
      'title',
      'Datacenter link unstable',
      'Packet loss between datacenters',
      standardUserId,
      '2026-06-08T15:30:00.000Z',
    ),
    history(
      7,
      8,
      'status',
      IncidentStatus.OPEN,
      IncidentStatus.IN_PROGRESS,
      standardUserId,
      '2026-06-08T15:45:00.000Z',
    ),
    history(
      8,
      9,
      'status',
      IncidentStatus.OPEN,
      IncidentStatus.RESOLVED,
      adminUserId,
      '2026-06-12T10:00:00.000Z',
    ),
    history(
      9,
      9,
      'resolvedAt',
      null,
      '2026-06-12T10:00:00.000Z',
      adminUserId,
      '2026-06-12T10:00:00.000Z',
    ),
    history(
      10,
      10,
      'status',
      IncidentStatus.OPEN,
      IncidentStatus.RESOLVED,
      standardUserId,
      '2026-06-13T16:30:00.000Z',
    ),
    history(
      11,
      10,
      'resolvedAt',
      null,
      '2026-06-13T16:30:00.000Z',
      standardUserId,
      '2026-06-13T16:30:00.000Z',
    ),
    history(
      12,
      11,
      'description',
      'Customer export failed during generation.',
      'Customer export file was regenerated after correcting invalid source records.',
      adminUserId,
      '2026-06-18T10:45:00.000Z',
    ),
    history(
      13,
      11,
      'status',
      IncidentStatus.OPEN,
      IncidentStatus.RESOLVED,
      adminUserId,
      '2026-06-18T11:20:00.000Z',
    ),
    history(
      14,
      11,
      'resolvedAt',
      null,
      '2026-06-18T11:20:00.000Z',
      adminUserId,
      '2026-06-18T11:20:00.000Z',
    ),
    history(
      15,
      12,
      'priority',
      IncidentPriority.HIGH,
      IncidentPriority.CRITICAL,
      standardUserId,
      '2026-06-22T16:50:00.000Z',
    ),
    history(
      16,
      12,
      'status',
      IncidentStatus.OPEN,
      IncidentStatus.RESOLVED,
      standardUserId,
      '2026-06-22T17:15:00.000Z',
    ),
    history(
      17,
      12,
      'resolvedAt',
      null,
      '2026-06-22T17:15:00.000Z',
      standardUserId,
      '2026-06-22T17:15:00.000Z',
    ),
    history(
      18,
      13,
      'status',
      IncidentStatus.OPEN,
      IncidentStatus.CANCELED,
      adminUserId,
      '2026-06-14T08:40:00.000Z',
    ),
    history(
      19,
      15,
      'priority',
      IncidentPriority.CRITICAL,
      IncidentPriority.HIGH,
      adminUserId,
      '2026-06-16T10:10:00.000Z',
    ),
    history(
      20,
      15,
      'status',
      IncidentStatus.OPEN,
      IncidentStatus.CANCELED,
      adminUserId,
      '2026-06-16T10:35:00.000Z',
    ),
  ];
}

function history(
  sequence: number,
  incidentSequence: number,
  field: string,
  oldValue: string | null,
  newValue: string | null,
  changedById: string,
  changedAt: string,
): DemoHistoryInput {
  return {
    id: `20000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    incidentId: `10000000-0000-4000-8000-${String(incidentSequence).padStart(12, '0')}`,
    field,
    oldValue,
    newValue,
    changedById,
    changedAt: date(changedAt),
  };
}

async function seedDemoIncidents(params: {
  adminUserId: string;
  standardUserId: string;
}): Promise<void> {
  const incidents = buildDemoIncidents(params);
  const histories = buildDemoHistory(params);

  for (const incident of incidents) {
    await upsertIncident(incident);
  }

  await prisma.incidentHistory.deleteMany({
    where: {
      incidentId: {
        in: incidents.map((incident) => incident.id),
      },
    },
  });

  await prisma.incidentHistory.createMany({
    data: histories,
  });
}

async function main(): Promise<void> {
  const adminUser = await upsertUser({
    id: ADMIN_USER_ID,
    name: 'HIT Admin',
    email: 'admin@hit.local',
    password: 'Admin123!',
    role: UserRole.ADMIN,
  });

  const standardUser = await upsertUser({
    id: STANDARD_USER_ID,
    name: 'HIT User',
    email: 'user@hit.local',
    password: 'User123!',
    role: UserRole.USER,
  });

  await seedDemoIncidents({
    adminUserId: adminUser.id,
    standardUserId: standardUser.id,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
