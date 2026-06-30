import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import * as supertest from 'supertest';

import { HttpExceptionFilter } from '../src/shared/presentation/http-exception.filter';
import { ZodValidationPipe } from '../src/shared/presentation/zod-validation.pipe';
import { IncidentCategory } from '../src/modules/incidents/domain/enums/incident-category.enum';
import { IncidentPriority } from '../src/modules/incidents/domain/enums/incident-priority.enum';
import { IncidentStatus } from '../src/modules/incidents/domain/enums/incident-status.enum';

loadEnv({ quiet: true });

const request = supertest as unknown as supertest.SuperTestStatic;
const E2E_SCHEMA_PREFIX = 'e2e_';
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

type AuthContext = {
  user: UserResponse;
  accessToken: string;
  password: string;
};

type IncidentResponse = {
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

type IncidentHistoryResponse = {
  id: string;
  incidentId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedById: string;
  changedAt: string;
};

type PaginatedIncidentsResponse = {
  data: IncidentResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

jest.setTimeout(120_000);

describe('HIT Communications API (e2e)', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaClient | undefined;
  let sequence = 0;

  beforeAll(async () => {
    const databaseUrl = getRequiredDatabaseUrlTest();

    assertSafeE2eDatabaseUrl(databaseUrl);

    process.env.DATABASE_URL = databaseUrl;
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-test-secret';
    process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';

    await ensureSchema(databaseUrl);
    runMigrations(databaseUrl);

    const { AppModule } = await import('../src/app.module');
    const { PrismaService } = await import('../src/infra/prisma/prisma.service');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    prisma = app.get(PrismaService);
    await resetDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    if (prisma) {
      await resetDatabase();
    }

    await app?.close();
  });

  it('registers, logs in and returns the authenticated user', async () => {
    const auth = await registerAndLogin({
      name: 'E2E Auth User',
      email: nextEmail('auth'),
    });

    expect(auth.accessToken).toEqual(expect.any(String));
    expect(auth.user).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(uuidRegex),
        name: 'E2E Auth User',
        email: auth.user.email,
        role: 'USER',
      }),
    );

    await request(getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(auth.user);
        expect(body.passwordHash).toBeUndefined();
      });
  });

  it('rejects invalid login credentials and protected requests without JWT', async () => {
    const auth = await registerAndLogin({
      name: 'E2E Protected User',
      email: nextEmail('protected'),
    });

    await request(getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: auth.user.email,
        password: 'wrong-password',
      })
      .expect(401)
      .expect({
        statusCode: 401,
        message: 'Invalid credentials',
      });

    await request(getHttpServer()).get('/api/v1/incidents').expect(401);
  });

  it('creates and fetches an incident with PostgreSQL persistence', async () => {
    const auth = await registerAndLogin({
      name: 'E2E Incident Owner',
      email: nextEmail('owner'),
    });

    const incident = await createIncident(auth, {
      category: IncidentCategory.NETWORK,
      priority: IncidentPriority.HIGH,
    });

    expect(incident).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(uuidRegex),
        title: expect.any(String),
        category: IncidentCategory.NETWORK,
        priority: IncidentPriority.HIGH,
        status: IncidentStatus.OPEN,
        assigneeId: auth.user.id,
        resolvedAt: null,
      }),
    );

    await request(getHttpServer())
      .get(`/api/v1/incidents/${incident.id}`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(incident);
      });
  });

  it('lists incidents with filters and pagination', async () => {
    const owner = await registerAndLogin({
      name: 'E2E List Owner',
      email: nextEmail('list-owner'),
    });
    const assignee = await registerAndLogin({
      name: 'E2E List Assignee',
      email: nextEmail('list-assignee'),
    });

    for (let index = 0; index < 12; index += 1) {
      await createIncident(owner, {
        title: `Paginated incident ${index + 1}`,
        category:
          index % 3 === 0
            ? IncidentCategory.NETWORK
            : index % 3 === 1
              ? IncidentCategory.DATA
              : IncidentCategory.SYSTEM,
        priority: index % 2 === 0 ? IncidentPriority.CRITICAL : IncidentPriority.LOW,
        assigneeId: index < 8 ? owner.user.id : assignee.user.id,
      });
    }

    const paginatedResponse = await request(getHttpServer())
      .get('/api/v1/incidents')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .query({
        page: '2',
        limit: '5',
      })
      .expect(200);
    const paginated = paginatedResponse.body as PaginatedIncidentsResponse;

    expect(paginated.meta).toEqual({
      page: 2,
      limit: 5,
      total: 12,
      totalPages: 3,
    });
    expect(paginated.data).toHaveLength(5);

    const filteredResponse = await request(getHttpServer())
      .get('/api/v1/incidents')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .query({
        priority: IncidentPriority.CRITICAL,
        category: IncidentCategory.NETWORK,
        assigneeId: owner.user.id,
      })
      .expect(200);
    const filtered = filteredResponse.body as PaginatedIncidentsResponse;

    expect(filtered.meta.total).toBeGreaterThan(0);
    expect(filtered.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          priority: IncidentPriority.CRITICAL,
          category: IncidentCategory.NETWORK,
          assigneeId: owner.user.id,
        }),
      ]),
    );
    expect(
      filtered.data.every(
        (incident) =>
          incident.priority === IncidentPriority.CRITICAL &&
          incident.category === IncidentCategory.NETWORK &&
          incident.assigneeId === owner.user.id,
      ),
    ).toBe(true);
  });

  it('rejects pagination limit above the maximum', async () => {
    const auth = await registerAndLogin({
      name: 'E2E Pagination User',
      email: nextEmail('pagination'),
    });

    await request(getHttpServer())
      .get('/api/v1/incidents')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .query({
        limit: '101',
      })
      .expect(422)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(422);
        expect(body.message).toBe('Validation failed');
        expect(body.errors).toEqual(
          expect.arrayContaining([
            {
              field: 'limit',
              message: 'Limit must be less than or equal to 100',
            },
          ]),
        );
      });
  });

  it('updates an incident and persists RF06 history in PostgreSQL', async () => {
    const owner = await registerAndLogin({
      name: 'E2E Update Owner',
      email: nextEmail('update-owner'),
    });
    const assignee = await registerAndLogin({
      name: 'E2E Update Assignee',
      email: nextEmail('update-assignee'),
    });
    const incident = await createIncident(owner, {
      title: 'Original VPN incident',
      description: 'Users cannot connect to the VPN gateway.',
      priority: IncidentPriority.HIGH,
    });

    const updatePayload = {
      title: 'VPN degraded',
      description: 'VPN access is unstable for remote users.',
      priority: IncidentPriority.CRITICAL,
      assigneeId: assignee.user.id,
      status: IncidentStatus.IN_PROGRESS,
    };
    const updatedResponse = await request(getHttpServer())
      .patch(`/api/v1/incidents/${incident.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(updatePayload)
      .expect(200);
    const updated = updatedResponse.body as IncidentResponse;

    expect(updated).toEqual(
      expect.objectContaining({
        id: incident.id,
        ...updatePayload,
        category: incident.category,
        resolvedAt: null,
      }),
    );

    await request(getHttpServer())
      .get(`/api/v1/incidents/${incident.id}/history`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const history = body as IncidentHistoryResponse[];
        expect(history).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              oldValue: 'Original VPN incident',
              newValue: updatePayload.title,
              changedById: owner.user.id,
            }),
            expect.objectContaining({
              field: 'description',
              oldValue: 'Users cannot connect to the VPN gateway.',
              newValue: updatePayload.description,
              changedById: owner.user.id,
            }),
            expect.objectContaining({
              field: 'priority',
              oldValue: IncidentPriority.HIGH,
              newValue: IncidentPriority.CRITICAL,
              changedById: owner.user.id,
            }),
            expect.objectContaining({
              field: 'assigneeId',
              oldValue: owner.user.id,
              newValue: assignee.user.id,
              changedById: owner.user.id,
            }),
            expect.objectContaining({
              field: 'status',
              oldValue: IncidentStatus.OPEN,
              newValue: IncidentStatus.IN_PROGRESS,
              changedById: owner.user.id,
            }),
          ]),
        );
      });
  });

  it('rejects RESOLVED in the generic update endpoint', async () => {
    const auth = await registerAndLogin({
      name: 'E2E Generic Resolve User',
      email: nextEmail('generic-resolve'),
    });
    const incident = await createIncident(auth);

    await request(getHttpServer())
      .patch(`/api/v1/incidents/${incident.id}`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        status: IncidentStatus.RESOLVED,
      })
      .expect(422)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(422);
        expect(body.message).toBe('Validation failed');
        expect(body.errors).toEqual(
          expect.arrayContaining([
            {
              field: 'status',
              message: 'Status must be OPEN, IN_PROGRESS or CANCELED',
            },
          ]),
        );
      });
  });

  it('resolves an incident, records history and rejects resolving it again', async () => {
    const auth = await registerAndLogin({
      name: 'E2E Resolve User',
      email: nextEmail('resolve'),
    });
    const incident = await createIncident(auth);

    const resolvedResponse = await request(getHttpServer())
      .patch(`/api/v1/incidents/${incident.id}/resolve`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(200);
    const resolved = resolvedResponse.body as IncidentResponse;

    expect(resolved.status).toBe(IncidentStatus.RESOLVED);
    expect(resolved.resolvedAt).toEqual(expect.any(String));

    await request(getHttpServer())
      .get(`/api/v1/incidents/${incident.id}/history`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const history = body as IncidentHistoryResponse[];
        expect(history).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'status',
              oldValue: IncidentStatus.OPEN,
              newValue: IncidentStatus.RESOLVED,
              changedById: auth.user.id,
            }),
            expect.objectContaining({
              field: 'resolvedAt',
              oldValue: null,
              newValue: resolved.resolvedAt,
              changedById: auth.user.id,
            }),
          ]),
        );
      });

    await request(getHttpServer())
      .patch(`/api/v1/incidents/${incident.id}/resolve`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(422)
      .expect({
        statusCode: 422,
        message: 'Incident is already resolved',
      });
  });

  it('soft deletes an incident and hides it from default queries', async () => {
    const auth = await registerAndLogin({
      name: 'E2E Delete User',
      email: nextEmail('delete'),
    });
    const incident = await createIncident(auth);

    await request(getHttpServer())
      .delete(`/api/v1/incidents/${incident.id}`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(204);

    await request(getHttpServer())
      .get(`/api/v1/incidents/${incident.id}`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'Incident not found',
      });

    await request(getHttpServer())
      .get('/api/v1/incidents')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const result = body as PaginatedIncidentsResponse;
        expect(result.meta.total).toBe(0);
        expect(result.data).toEqual([]);
      });
  });

  async function resetDatabase(): Promise<void> {
    if (!prisma) {
      throw new Error('Prisma was not initialized for e2e tests');
    }

    await prisma.incidentHistory.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.user.deleteMany();
  }

  async function registerAndLogin(params: {
    name: string;
    email: string;
    password?: string;
  }): Promise<AuthContext> {
    const password = params.password ?? 'StrongPass123';

    await request(getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: params.name,
        email: params.email,
        password,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            id: expect.stringMatching(uuidRegex),
            name: params.name,
            email: params.email,
            role: 'USER',
          }),
        );
        expect(body.passwordHash).toBeUndefined();
      });

    const loginResponse = await request(getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: params.email,
        password,
      })
      .expect(200);

    const body = loginResponse.body as {
      accessToken: string;
      tokenType: 'Bearer';
      user: UserResponse;
    };

    expect(body.tokenType).toBe('Bearer');

    return {
      user: body.user,
      accessToken: body.accessToken,
      password,
    };
  }

  async function createIncident(
    auth: AuthContext,
    overrides: Partial<{
      title: string;
      description: string;
      category: IncidentCategory;
      priority: IncidentPriority;
      assigneeId: string;
    }> = {},
  ): Promise<IncidentResponse> {
    const currentSequence = nextSequence();
    const payload = {
      title: overrides.title ?? `E2E incident ${currentSequence}`,
      description:
        overrides.description ?? `E2E incident description ${currentSequence} with enough detail.`,
      category: overrides.category ?? IncidentCategory.NETWORK,
      priority: overrides.priority ?? IncidentPriority.HIGH,
      assigneeId: overrides.assigneeId ?? auth.user.id,
    };

    const response = await request(getHttpServer())
      .post('/api/v1/incidents')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send(payload)
      .expect(201);

    return response.body as IncidentResponse;
  }

  function nextEmail(prefix: string): string {
    return `${prefix}-${nextSequence()}@e2e.hit.local`;
  }

  function nextSequence(): number {
    sequence += 1;
    return sequence;
  }

  function getHttpServer(): ReturnType<INestApplication['getHttpServer']> {
    if (!app) {
      throw new Error('Nest application was not initialized for e2e tests');
    }

    return app.getHttpServer();
  }
});

function getRequiredDatabaseUrlTest(): string {
  const databaseUrl = process.env.DATABASE_URL_TEST?.trim();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL_TEST must be set before running e2e tests.');
  }

  return databaseUrl;
}

function assertSafeE2eDatabaseUrl(databaseUrl: string): void {
  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL_TEST must be a valid PostgreSQL URL.');
  }

  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL_TEST must use a PostgreSQL connection URL.');
  }

  const schemaName = url.searchParams.get('schema');

  if (!schemaName) {
    throw new Error(
      'DATABASE_URL_TEST must include an explicit isolated schema, for example ?schema=e2e_test.',
    );
  }

  if (schemaName === 'public') {
    throw new Error('DATABASE_URL_TEST must not use schema=public for e2e tests.');
  }

  if (!schemaName.startsWith(E2E_SCHEMA_PREFIX)) {
    throw new Error(
      `DATABASE_URL_TEST schema must start with "${E2E_SCHEMA_PREFIX}" to make destructive e2e cleanup safe.`,
    );
  }
}

async function ensureSchema(databaseUrl: string): Promise<void> {
  const schemaName = getSchemaName(databaseUrl);

  if (schemaName === 'public') {
    return;
  }

  const prismaForSchema = new PrismaClient({
    datasources: {
      db: {
        url: getSchemaBootstrapUrl(databaseUrl),
      },
    },
  });

  try {
    await prismaForSchema.$executeRawUnsafe(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName.replace(/"/g, '""')}"`,
    );
  } finally {
    await prismaForSchema.$disconnect();
  }
}

function getSchemaName(databaseUrl: string): string {
  try {
    return new URL(databaseUrl).searchParams.get('schema') ?? 'public';
  } catch {
    return 'public';
  }
}

function getSchemaBootstrapUrl(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    url.searchParams.delete('schema');
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

function runMigrations(databaseUrl: string): void {
  const prismaCli = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');

  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: 'inherit',
  });
}
