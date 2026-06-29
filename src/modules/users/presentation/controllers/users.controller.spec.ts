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
import { UserRole } from '../../domain/enums/user-role.enum';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { UsersController } from './users.controller';

const request = supertest as unknown as supertest.SuperTestStatic;

const userOutput = {
  id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  name: 'HIT User',
  email: 'user@hit.local',
  role: UserRole.USER,
  createdAt: '2026-06-29T12:00:00.000Z',
  updatedAt: '2026-06-29T12:00:00.000Z',
};

const adminOutput = {
  id: 'd1694df5-f0db-47d5-9d8e-889ad5ac73a0',
  name: 'HIT Admin',
  email: 'admin@hit.local',
  role: UserRole.ADMIN,
  createdAt: '2026-06-29T12:00:00.000Z',
  updatedAt: '2026-06-29T12:00:00.000Z',
};

describe('UsersController', () => {
  let app: INestApplication;
  const jwtService = new JwtService({
    secret: 'test-secret',
  });
  const listUsersUseCase = {
    execute: jest.fn(),
  };
  const getUserByIdUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    listUsersUseCase.execute.mockResolvedValue([userOutput, adminOutput]);
    getUserByIdUseCase.execute.mockResolvedValue(userOutput);

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({
          defaultStrategy: 'jwt',
        }),
      ],
      controllers: [UsersController],
      providers: [
        {
          provide: ListUsersUseCase,
          useValue: listUsersUseCase,
        },
        {
          provide: GetUserByIdUseCase,
          useValue: getUserByIdUseCase,
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

  it('lists users through the protected endpoint', async () => {
    const accessToken = await createAccessToken();

    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect([userOutput, adminOutput]);

    expect(listUsersUseCase.execute).toHaveBeenCalledWith();
  });

  it('gets a user by id through the protected endpoint', async () => {
    const accessToken = await createAccessToken();

    await request(app.getHttpServer())
      .get(`/api/v1/users/${userOutput.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(userOutput);

    expect(getUserByIdUseCase.execute).toHaveBeenCalledWith({
      id: userOutput.id,
    });
  });

  it('rejects users endpoint without bearer token', async () => {
    await request(app.getHttpServer()).get('/api/v1/users').expect(401);
  });

  it('returns 422 for invalid user id param', async () => {
    const accessToken = await createAccessToken();

    await request(app.getHttpServer())
      .get('/api/v1/users/not-a-uuid')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(422)
      .expect(({ body }) => {
        expect(body).toEqual({
          statusCode: 422,
          message: 'Validation failed',
          errors: [
            {
              field: 'id',
              message: 'User id must be a valid UUID',
            },
          ],
        });
      });

    expect(getUserByIdUseCase.execute).not.toHaveBeenCalled();
  });

  it('maps user not found to 404', async () => {
    const accessToken = await createAccessToken();
    getUserByIdUseCase.execute.mockRejectedValueOnce(
      new ResourceNotFoundError('User not found'),
    );

    await request(app.getHttpServer())
      .get(`/api/v1/users/${userOutput.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'User not found',
      });
  });

  function createAccessToken(): Promise<string> {
    return jwtService.signAsync({
      sub: userOutput.id,
      email: userOutput.email,
      role: userOutput.role,
    });
  }
});
