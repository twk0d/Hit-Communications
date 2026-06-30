import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../../auth/infra/guards/jwt-auth.guard';
import { IncidentOutput } from '../../application/dtos/incident-output';
import { CreateIncidentUseCase } from '../../application/use-cases/create-incident.use-case';
import { GetIncidentByIdUseCase } from '../../application/use-cases/get-incident-by-id.use-case';
import { CreateIncidentDto } from '../dtos/create-incident.dto';
import { GetIncidentParamsDto } from '../dtos/get-incident-params.dto';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(
    private readonly createIncidentUseCase: CreateIncidentUseCase,
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

  @Get(':id')
  getById(@Param() params: GetIncidentParamsDto): Promise<IncidentOutput> {
    return this.getIncidentByIdUseCase.execute({
      id: params.id,
    });
  }
}
