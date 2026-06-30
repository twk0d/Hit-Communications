import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import * as supertest from 'supertest';

import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { HttpExceptionFilter } from '../../../../shared/presentation/http-exception.filter';
import { ZodValidationPipe } from '../../../../shared/presentation/zod-validation.pipe';
import { JwtStrategy } from '../../../auth/infra/strategies/jwt.strategy';
import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { CreateIncidentUseCase } from '../../application/use-cases/create-incident.use-case';
import { GetIncidentByIdUseCase } from '../../application/use-cases/get-incident-by-id.use-case';
import { IncidentsController } from './incidents.controller';

const request = supertest as unknown as supertest.SuperTestStatic;

const authenticatedUser = {
  id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  email: 'user@hit.local',
  role: UserRole.USER,
};

const incidentOutput = {
  id: '8d843a6e-8929-44a8-8ccb-41c52773f6b1',
  title: 'VPN unavailable',
  description: 'Users cannot connect to the VPN gateway.',
  category: IncidentCategory.NETWORK,
  priority: IncidentPriority.HIGH,
  status: IncidentStatus.OPEN,
  assigneeId: authenticatedUser.id,
  createdAt: '2026-06-29T12:00:00.000Z',
  updatedAt: '2026-06-29T12:00:00.000Z',
  resolvedAt: null,
};

describe('IncidentsController', () => {
  let app: INestApplication;
  const jwtService = new JwtService({
    secret: 'test-secret',
  });
  const createIncidentUseCase = {
    execute: jest.fn(),
  };
  const getIncidentByIdUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    createIncidentUseCase.execute.mockResolvedValue(incidentOutput);
    getIncidentByIdUseCase.execute.mockResolvedValue(incidentOutput);

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({
          defaultStrategy: 'jwt',
        }),
      ],
      controllers: [IncidentsController],
      providers: [
        {
          provide: CreateIncidentUseCase,
          useValue: createIncidentUseCase,
        },
        {
          provide: GetIncidentByIdUseCase,
          useValue: getIncidentByIdUseCase,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        JwtStrategy,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('creates an incident through the protected endpoint', async () => {
    const accessToken = await createAccessToken();

    await request(app.getHttpServer())
      .post('/api/v1/incidents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: ' VPN unavailable ',
        description: ' Users cannot connect to the VPN gateway. ',
        category: IncidentCategory.NETWORK,
        priority: IncidentPriority.HIGH,
        assigneeId: authenticatedUser.id,
      })
      .expect(201)
      .expect(incidentOutput);

    expect(createIncidentUseCase.execute).toHaveBeenCalledWith({
      title: 'VPN unavailable',
      description: 'Users cannot connect to the VPN gateway.',
      category: IncidentCategory.NETWORK,
      priority: IncidentPriority.HIGH,
      assigneeId: authenticatedUser.id,
    });
  });

  it('rejects create endpoint without bearer token', async () => {
    await request(app.getHttpServer()).post('/api/v1/incidents').expect(401);
  });

  it('gets an incident by id through the protected endpoint', async () => {
    const accessToken = await createAccessToken();

    await request(app.getHttpServer())
      .get(`/api/v1/incidents/${incidentOutput.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(incidentOutput);

    expect(getIncidentByIdUseCase.execute).toHaveBeenCalledWith({
      id: incidentOutput.id,
    });
  });

  it('rejects get by id endpoint without bearer token', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/incidents/${incidentOutput.id}`)
      .expect(401);
  });

  it('returns 422 for invalid incident id param', async () => {
    const accessToken = await createAccessToken();

    await request(app.getHttpServer())
      .get('/api/v1/incidents/not-a-uuid')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(422)
      .expect(({ body }) => {
        expect(body).toEqual({
          statusCode: 422,
          message: 'Validation failed',
          errors: [
            {
              field: 'id',
              message: 'Incident id must be a valid UUID',
            },
          ],
        });
      });

    expect(getIncidentByIdUseCase.execute).not.toHaveBeenCalled();
  });

  it('maps incident not found to 404', async () => {
    const accessToken = await createAccessToken();
    getIncidentByIdUseCase.execute.mockRejectedValueOnce(
      new ResourceNotFoundError('Incident not found'),
    );

    await request(app.getHttpServer())
      .get(`/api/v1/incidents/${incidentOutput.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'Incident not found',
      });
  });

  it('returns 422 for invalid create payload', async () => {
    const accessToken = await createAccessToken();

    await request(app.getHttpServer())
      .post('/api/v1/incidents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: '',
        description: 'short',
        category: 'INVALID',
        priority: 'WRONG',
        assigneeId: 'not-a-uuid',
      })
      .expect(422)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(422);
        expect(body.message).toBe('Validation failed');
        expect(body.errors).toEqual(
          expect.arrayContaining([
            {
              field: 'title',
              message: 'Title must be at least 3 characters',
            },
            {
              field: 'description',
              message: 'Description must be at least 10 characters',
            },
            {
              field: 'assigneeId',
              message: 'Assignee id must be a valid UUID',
            },
          ]),
        );
      });

    expect(createIncidentUseCase.execute).not.toHaveBeenCalled();
  });

  it('maps assignee not found to 404', async () => {
    const accessToken = await createAccessToken();
    createIncidentUseCase.execute.mockRejectedValueOnce(
      new ResourceNotFoundError('Assignee not found'),
    );

    await request(app.getHttpServer())
      .post('/api/v1/incidents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'VPN unavailable',
        description: 'Users cannot connect to the VPN gateway.',
        category: IncidentCategory.NETWORK,
        priority: IncidentPriority.HIGH,
        assigneeId: authenticatedUser.id,
      })
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'Assignee not found',
      });
  });

  function createAccessToken(): Promise<string> {
    return jwtService.signAsync({
      sub: authenticatedUser.id,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
    });
  }
});
