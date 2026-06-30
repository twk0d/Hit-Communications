import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import {
  applicationErrorSchema,
  invalidIncidentUuidValidationExample,
  unauthorizedErrorExample,
  validationErrorSchema,
} from '../../../../shared/presentation/openapi/error.openapi';
import { LogOperation } from '../../../../shared/presentation/logging/log-operation.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/infra/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../../auth/infra/types/authenticated-user';
import { IncidentHistoryOutput } from '../../application/dtos/incident-history-output';
import { IncidentOutput } from '../../application/dtos/incident-output';
import { CreateIncidentUseCase } from '../../application/use-cases/create-incident.use-case';
import { DeleteIncidentUseCase } from '../../application/use-cases/delete-incident.use-case';
import { GetIncidentHistoryUseCase } from '../../application/use-cases/get-incident-history.use-case';
import { GetIncidentByIdUseCase } from '../../application/use-cases/get-incident-by-id.use-case';
import { ListIncidentsUseCase } from '../../application/use-cases/list-incidents.use-case';
import { ResolveIncidentUseCase } from '../../application/use-cases/resolve-incident.use-case';
import { UpdateIncidentUseCase } from '../../application/use-cases/update-incident.use-case';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { CreateIncidentDto } from '../dtos/create-incident.dto';
import { GetIncidentParamsDto } from '../dtos/get-incident-params.dto';
import { ListIncidentsQueryDto } from '../dtos/list-incidents-query.dto';
import { UpdateIncidentDto } from '../dtos/update-incident.dto';
import {
  assigneeNotFoundErrorExample,
  createIncidentRequestExample,
  createIncidentRequestSchema,
  incidentAlreadyResolvedErrorExample,
  incidentExample,
  incidentHistoryExample,
  incidentHistorySchema,
  incidentNotFoundErrorExample,
  incidentSchema,
  incidentValidationErrorExample,
  paginatedIncidentsExample,
  paginatedIncidentsSchema,
  resolvedIncidentExample,
  resolvedIncidentUpdateErrorExample,
  updatedIncidentExample,
  updateIncidentRequestExample,
  updateIncidentRequestSchema,
} from '../openapi/incidents.openapi';
import { PaginatedResult } from '../../../../shared/application/pagination/pagination';

@ApiTags('Incidents')
@ApiBearerAuth('access-token')
@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(
    private readonly createIncidentUseCase: CreateIncidentUseCase,
    private readonly listIncidentsUseCase: ListIncidentsUseCase,
    private readonly getIncidentByIdUseCase: GetIncidentByIdUseCase,
    private readonly updateIncidentUseCase: UpdateIncidentUseCase,
    private readonly resolveIncidentUseCase: ResolveIncidentUseCase,
    private readonly deleteIncidentUseCase: DeleteIncidentUseCase,
    private readonly getIncidentHistoryUseCase: GetIncidentHistoryUseCase,
  ) {}

  @Post()
  @LogOperation('incident.create')
  @ApiOperation({
    summary: 'Create incident',
    description: 'Creates an incident with initial status OPEN.',
  })
  @ApiBody({
    schema: createIncidentRequestSchema,
    examples: {
      default: {
        value: createIncidentRequestExample,
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Incident created successfully.',
    schema: incidentSchema,
    example: incidentExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: applicationErrorSchema,
    example: unauthorizedErrorExample,
  })
  @ApiNotFoundResponse({
    description: 'Assignee user not found.',
    schema: applicationErrorSchema,
    example: assigneeNotFoundErrorExample,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Request body validation failed.',
    schema: validationErrorSchema,
    example: incidentValidationErrorExample,
  })
  create(@Body() body: CreateIncidentDto): Promise<IncidentOutput> {
    return this.createIncidentUseCase.execute({
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority,
      assigneeId: body.assigneeId,
    });
  }

  @Get()
  @LogOperation('incident.list')
  @ApiOperation({
    summary: 'List incidents',
    description: 'Lists active incidents with filters, pagination and createdAt desc ordering.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number. Defaults to 1.',
    schema: {
      type: 'integer',
      minimum: 1,
      default: 1,
      example: 1,
    },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page. Defaults to 10 and maxes at 100.',
    schema: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 10,
      example: 10,
    },
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: Object.values(IncidentStatus),
    example: IncidentStatus.OPEN,
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: Object.values(IncidentPriority),
    example: IncidentPriority.HIGH,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: Object.values(IncidentCategory),
    example: IncidentCategory.NETWORK,
  })
  @ApiQuery({
    name: 'assigneeId',
    required: false,
    description: 'Filter incidents by assignee UUID.',
    schema: {
      type: 'string',
      format: 'uuid',
      example: incidentExample.assigneeId,
    },
  })
  @ApiQuery({
    name: 'createdFrom',
    required: false,
    description: 'Inclusive createdAt lower bound in ISO 8601.',
    schema: {
      type: 'string',
      format: 'date-time',
      example: '2026-06-01T00:00:00.000Z',
    },
  })
  @ApiQuery({
    name: 'createdTo',
    required: false,
    description: 'Inclusive createdAt upper bound in ISO 8601.',
    schema: {
      type: 'string',
      format: 'date-time',
      example: '2026-06-30T23:59:59.000Z',
    },
  })
  @ApiQuery({
    name: 'resolvedFrom',
    required: false,
    description: 'Inclusive resolvedAt lower bound in ISO 8601.',
    schema: {
      type: 'string',
      format: 'date-time',
      example: '2026-06-01T00:00:00.000Z',
    },
  })
  @ApiQuery({
    name: 'resolvedTo',
    required: false,
    description: 'Inclusive resolvedAt upper bound in ISO 8601.',
    schema: {
      type: 'string',
      format: 'date-time',
      example: '2026-06-30T23:59:59.000Z',
    },
  })
  @ApiOkResponse({
    description: 'Paginated active incidents.',
    schema: paginatedIncidentsSchema,
    example: paginatedIncidentsExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: applicationErrorSchema,
    example: unauthorizedErrorExample,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Query validation failed.',
    schema: validationErrorSchema,
    example: {
      statusCode: 422,
      message: 'Validation failed',
      errors: [
        {
          field: 'limit',
          message: 'Limit must be less than or equal to 100',
        },
      ],
    },
  })
  list(@Query() query: ListIncidentsQueryDto): Promise<PaginatedResult<IncidentOutput>> {
    return this.listIncidentsUseCase.execute({
      page: query.page,
      limit: query.limit,
      status: query.status,
      priority: query.priority,
      category: query.category,
      assigneeId: query.assigneeId,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      resolvedFrom: query.resolvedFrom,
      resolvedTo: query.resolvedTo,
    });
  }

  @Get(':id')
  @LogOperation('incident.get')
  @ApiOperation({
    summary: 'Get incident by ID',
    description: 'Returns one active incident by UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Incident UUID.',
    schema: {
      type: 'string',
      format: 'uuid',
      example: incidentExample.id,
    },
  })
  @ApiOkResponse({
    description: 'Incident found.',
    schema: incidentSchema,
    example: incidentExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: applicationErrorSchema,
    example: unauthorizedErrorExample,
  })
  @ApiNotFoundResponse({
    description: 'Incident not found.',
    schema: applicationErrorSchema,
    example: incidentNotFoundErrorExample,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid incident UUID.',
    schema: validationErrorSchema,
    example: invalidIncidentUuidValidationExample,
  })
  getById(@Param() params: GetIncidentParamsDto): Promise<IncidentOutput> {
    return this.getIncidentByIdUseCase.execute({
      id: params.id,
    });
  }

  @Get(':id/history')
  @LogOperation('incident.history.list')
  @ApiOperation({
    summary: 'Get incident history',
    description: 'Returns incident history ordered by changedAt descending.',
  })
  @ApiParam({
    name: 'id',
    description: 'Incident UUID.',
    schema: {
      type: 'string',
      format: 'uuid',
      example: incidentExample.id,
    },
  })
  @ApiOkResponse({
    description: 'Incident history entries.',
    schema: {
      type: 'array',
      items: incidentHistorySchema,
    },
    example: [incidentHistoryExample],
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: applicationErrorSchema,
    example: unauthorizedErrorExample,
  })
  @ApiNotFoundResponse({
    description: 'Incident not found.',
    schema: applicationErrorSchema,
    example: incidentNotFoundErrorExample,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid incident UUID.',
    schema: validationErrorSchema,
    example: invalidIncidentUuidValidationExample,
  })
  getHistory(
    @Param() params: GetIncidentParamsDto,
  ): Promise<IncidentHistoryOutput[]> {
    return this.getIncidentHistoryUseCase.execute({
      incidentId: params.id,
    });
  }

  @Patch(':id/resolve')
  @LogOperation('incident.resolve')
  @ApiOperation({
    summary: 'Resolve incident',
    description: 'Sets status to RESOLVED and fills resolvedAt automatically.',
  })
  @ApiParam({
    name: 'id',
    description: 'Incident UUID.',
    schema: {
      type: 'string',
      format: 'uuid',
      example: incidentExample.id,
    },
  })
  @ApiOkResponse({
    description: 'Incident resolved successfully.',
    schema: incidentSchema,
    example: resolvedIncidentExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: applicationErrorSchema,
    example: unauthorizedErrorExample,
  })
  @ApiNotFoundResponse({
    description: 'Incident not found.',
    schema: applicationErrorSchema,
    example: incidentNotFoundErrorExample,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid UUID or incident already resolved.',
    schema: applicationErrorSchema,
    examples: {
      alreadyResolved: {
        summary: 'Incident already resolved',
        value: incidentAlreadyResolvedErrorExample,
      },
      invalidUuid: {
        summary: 'Invalid incident UUID',
        value: invalidIncidentUuidValidationExample,
      },
    },
  })
  resolve(
    @Param() params: GetIncidentParamsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IncidentOutput> {
    return this.resolveIncidentUseCase.execute({
      id: params.id,
      changedById: user.id,
    });
  }

  @Patch(':id')
  @LogOperation('incident.update')
  @ApiOperation({
    summary: 'Update incident',
    description:
      'Updates editable incident fields and records RF06 history in the same transaction.',
  })
  @ApiParam({
    name: 'id',
    description: 'Incident UUID.',
    schema: {
      type: 'string',
      format: 'uuid',
      example: incidentExample.id,
    },
  })
  @ApiBody({
    schema: updateIncidentRequestSchema,
    examples: {
      default: {
        value: updateIncidentRequestExample,
      },
    },
  })
  @ApiOkResponse({
    description: 'Incident updated successfully.',
    schema: incidentSchema,
    example: updatedIncidentExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: applicationErrorSchema,
    example: unauthorizedErrorExample,
  })
  @ApiNotFoundResponse({
    description: 'Incident or assignee not found.',
    schema: applicationErrorSchema,
    examples: {
      incidentNotFound: {
        summary: 'Incident not found',
        value: incidentNotFoundErrorExample,
      },
      assigneeNotFound: {
        summary: 'Assignee not found',
        value: assigneeNotFoundErrorExample,
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Request validation failed or the incident cannot be updated in its current state.',
    schema: validationErrorSchema,
    examples: {
      validation: {
        summary: 'Validation failed',
        value: incidentValidationErrorExample,
      },
      resolvedIncident: {
        summary: 'Resolved incident cannot be updated',
        value: resolvedIncidentUpdateErrorExample,
      },
    },
  })
  update(
    @Param() params: GetIncidentParamsDto,
    @Body() body: UpdateIncidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IncidentOutput> {
    return this.updateIncidentUseCase.execute({
      id: params.id,
      title: body.title,
      description: body.description,
      priority: body.priority,
      assigneeId: body.assigneeId,
      status: body.status,
      changedById: user.id,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @LogOperation('incident.softDelete')
  @ApiOperation({
    summary: 'Soft delete incident',
    description: 'Marks the incident as deleted by filling deletedAt.',
  })
  @ApiParam({
    name: 'id',
    description: 'Incident UUID.',
    schema: {
      type: 'string',
      format: 'uuid',
      example: incidentExample.id,
    },
  })
  @ApiNoContentResponse({
    description: 'Incident soft deleted successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: applicationErrorSchema,
    example: unauthorizedErrorExample,
  })
  @ApiNotFoundResponse({
    description: 'Incident not found.',
    schema: applicationErrorSchema,
    example: incidentNotFoundErrorExample,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid incident UUID.',
    schema: validationErrorSchema,
    example: invalidIncidentUuidValidationExample,
  })
  delete(@Param() params: GetIncidentParamsDto): Promise<void> {
    return this.deleteIncidentUseCase.execute({
      id: params.id,
    });
  }
}
