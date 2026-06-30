import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import {
  applicationErrorSchema,
  unauthorizedErrorExample,
  validationErrorSchema,
} from '../../../../shared/presentation/openapi/error.openapi';
import { UserOutput } from '../../application/dtos/user-output';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { JwtAuthGuard } from '../../../auth/infra/guards/jwt-auth.guard';
import { GetUserParamsDto } from '../dtos/get-user-params.dto';
import {
  adminUserExample,
  invalidUserUuidValidationExample,
  userExample,
  userNotFoundErrorExample,
  userSchema,
} from '../openapi/users.openapi';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List users',
    description: 'Lists active users available for incident assignment.',
  })
  @ApiOkResponse({
    description: 'Active users.',
    schema: {
      type: 'array',
      items: userSchema,
    },
    example: [adminUserExample, userExample],
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: applicationErrorSchema,
    example: unauthorizedErrorExample,
  })
  list(): Promise<UserOutput[]> {
    return this.listUsersUseCase.execute();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns public data for one active user.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID.',
    schema: {
      type: 'string',
      format: 'uuid',
      example: userExample.id,
    },
  })
  @ApiOkResponse({
    description: 'User found.',
    schema: userSchema,
    example: userExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: applicationErrorSchema,
    example: unauthorizedErrorExample,
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
    schema: applicationErrorSchema,
    example: userNotFoundErrorExample,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid user UUID.',
    schema: validationErrorSchema,
    example: invalidUserUuidValidationExample,
  })
  getById(@Param() params: GetUserParamsDto): Promise<UserOutput> {
    return this.getUserByIdUseCase.execute({
      id: params.id,
    });
  }
}
