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
import { CreateIncidentDto } from '../dtos/create-incident.dto';
import { GetIncidentParamsDto } from '../dtos/get-incident-params.dto';
import { ListIncidentsQueryDto } from '../dtos/list-incidents-query.dto';
import { UpdateIncidentDto } from '../dtos/update-incident.dto';
import { PaginatedResult } from '../../../../shared/application/pagination/pagination';

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
  getById(@Param() params: GetIncidentParamsDto): Promise<IncidentOutput> {
    return this.getIncidentByIdUseCase.execute({
      id: params.id,
    });
  }

  @Get(':id/history')
  getHistory(
    @Param() params: GetIncidentParamsDto,
  ): Promise<IncidentHistoryOutput[]> {
    return this.getIncidentHistoryUseCase.execute({
      incidentId: params.id,
    });
  }

  @Patch(':id/resolve')
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
  delete(@Param() params: GetIncidentParamsDto): Promise<void> {
    return this.deleteIncidentUseCase.execute({
      id: params.id,
    });
  }
}
