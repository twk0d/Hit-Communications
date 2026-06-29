import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import * as supertest from 'supertest';

import { ZodValidationPipe } from '../../../../shared/presentation/zod-validation.pipe';
import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { JwtStrategy } from '../../infra/strategies/jwt.strategy';
import { AuthController } from './auth.controller';

const request = supertest as unknown as supertest.SuperTestStatic;

const userOutput = {
  id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  name: 'HIT User',
  email: 'user@hit.local',
  role: UserRole.USER,
  createdAt: '2026-06-29T12:00:00.000Z',
  updatedAt: '2026-06-29T12:00:00.000Z',
};

describe('AuthController', () => {
  let app: INestApplication;
  const jwtService = new JwtService({
    secret: 'test-secret',
  });
  const registerUserUseCase = {
    execute: jest.fn(),
  };
  const loginUseCase = {
    execute: jest.fn(),
  };
  const getMeUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    registerUserUseCase.execute.mockResolvedValue(userOutput);
    loginUseCase.execute.mockResolvedValue({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      user: userOutput,
    });
    getMeUseCase.execute.mockResolvedValue(userOutput);

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({
          defaultStrategy: 'jwt',
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: RegisterUserUseCase,
          useValue: registerUserUseCase,
        },
        {
          provide: LoginUseCase,
          useValue: loginUseCase,
        },
        {
          provide: GetMeUseCase,
          useValue: getMeUseCase,
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
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('registers a user through the public endpoint', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'HIT User',
        email: 'USER@hit.local',
        password: 'User123!',
      })
      .expect(201)
      .expect(userOutput);

    expect(registerUserUseCase.execute).toHaveBeenCalledWith({
      name: 'HIT User',
      email: 'USER@hit.local',
      password: 'User123!',
    });
  });

  it('logs in through the public endpoint', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@hit.local',
        password: 'User123!',
      })
      .expect(200)
      .expect({
        accessToken: 'access-token',
        tokenType: 'Bearer',
        user: userOutput,
      });

    expect(loginUseCase.execute).toHaveBeenCalledWith({
      email: 'user@hit.local',
      password: 'User123!',
    });
  });

  it('returns authenticated user through the protected endpoint', async () => {
    const accessToken = await jwtService.signAsync({
      sub: userOutput.id,
      email: userOutput.email,
      role: userOutput.role,
    });

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(userOutput);

    expect(getMeUseCase.execute).toHaveBeenCalledWith({
      userId: userOutput.id,
    });
  });

  it('rejects me endpoint without bearer token', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('returns 422 for invalid register payload', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: '',
        email: 'invalid-email',
        password: 'short',
      })
      .expect(422)
      .expect(({ body }) => {
        expect(body).toEqual({
          statusCode: 422,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            {
              field: 'name',
              message: 'Name must be at least 2 characters',
            },
            {
              field: 'email',
              message: 'Email must be valid',
            },
            {
              field: 'password',
              message: 'Password must be at least 8 characters',
            },
          ]),
        });
      });
  });

  it('returns 422 for login password above the maximum size', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@hit.local',
        password: 'a'.repeat(73),
      })
      .expect(422)
      .expect(({ body }) => {
        expect(body).toEqual({
          statusCode: 422,
          message: 'Validation failed',
          errors: [
            {
              field: 'password',
              message: 'Password must be at most 72 characters',
            },
          ],
        });
      });

    expect(loginUseCase.execute).not.toHaveBeenCalled();
  });
});
