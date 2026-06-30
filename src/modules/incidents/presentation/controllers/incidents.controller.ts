import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../../auth/infra/guards/jwt-auth.guard';
import { IncidentOutput } from '../../application/dtos/incident-output';
import { CreateIncidentUseCase } from '../../application/use-cases/create-incident.use-case';
import { GetIncidentByIdUseCase } from '../../application/use-cases/get-incident-by-id.use-case';
import { ListIncidentsUseCase } from '../../application/use-cases/list-incidents.use-case';
import { CreateIncidentDto } from '../dtos/create-incident.dto';
import { GetIncidentParamsDto } from '../dtos/get-incident-params.dto';
import { ListIncidentsQueryDto } from '../dtos/list-incidents-query.dto';
import { PaginatedResult } from '../../../../shared/application/pagination/pagination';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(
    private readonly createIncidentUseCase: CreateIncidentUseCase,
    private readonly listIncidentsUseCase: ListIncidentsUseCase,
    private readonly getIncidentByIdUseCase: GetIncidentByIdUseCase,
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
}
