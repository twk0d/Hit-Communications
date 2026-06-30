import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import {
  applicationErrorSchema,
  unauthorizedErrorExample,
  validationErrorSchema,
} from '../../../../shared/presentation/openapi/error.openapi';
import { LogOperation } from '../../../../shared/presentation/logging/log-operation.decorator';
import { UserOutput } from '../../../users/application/dtos/user-output';
import {
  userExample,
  userSchema,
} from '../../../users/presentation/openapi/users.openapi';
import { AuthOutput } from '../../application/dtos/auth-output';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { JwtAuthGuard } from '../../infra/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../infra/types/authenticated-user';
import { CurrentUser } from '../decorators/current-user.decorator';
import { LoginDto } from '../dtos/login.dto';
import { RegisterUserDto } from '../dtos/register-user.dto';
import {
  authExample,
  authSchema,
  authValidationErrorExample,
  loginRequestExample,
  loginRequestSchema,
  registerConflictErrorExample,
  registerRequestExample,
  registerRequestSchema,
} from '../openapi/auth.openapi';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Post('register')
  @LogOperation('auth.register')
  @ApiOperation({
    summary: 'Register a user',
    description: 'Creates a public user account and returns public user data.',
  })
  @ApiBody({
    schema: registerRequestSchema,
    examples: {
      default: {
        value: registerRequestExample,
      },
    },
  })
  @ApiCreatedResponse({
    description: 'User registered successfully.',
    schema: userSchema,
    example: userExample,
  })
  @ApiConflictResponse({
    description: 'Email is already registered.',
    schema: applicationErrorSchema,
    example: registerConflictErrorExample,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Request body validation failed.',
    schema: validationErrorSchema,
    example: authValidationErrorExample,
  })
  register(@Body() body: RegisterUserDto): Promise<UserOutput> {
    return this.registerUserUseCase.execute({
      name: body.name,
      email: body.email,
      password: body.password,
    });
  }

  @Post('login')
  @HttpCode(200)
  @LogOperation('auth.login')
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticates a user and returns a JWT access token.',
  })
  @ApiBody({
    schema: loginRequestSchema,
    examples: {
      default: {
        value: loginRequestExample,
      },
    },
  })
  @ApiOkResponse({
    description: 'User authenticated successfully.',
    schema: authSchema,
    example: authExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials.',
    schema: applicationErrorSchema,
    example: {
      statusCode: 401,
      message: 'Invalid credentials',
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Request body validation failed.',
    schema: validationErrorSchema,
    example: authValidationErrorExample,
  })
  login(@Body() body: LoginDto): Promise<AuthOutput> {
    return this.loginUseCase.execute({
      email: body.email,
      password: body.password,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @LogOperation('auth.me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get authenticated user',
    description: 'Returns public data for the user represented by the JWT.',
  })
  @ApiOkResponse({
    description: 'Authenticated user data.',
    schema: userSchema,
    example: userExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: applicationErrorSchema,
    example: unauthorizedErrorExample,
  })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserOutput> {
    return this.getMeUseCase.execute({
      userId: user.id,
    });
  }
}
