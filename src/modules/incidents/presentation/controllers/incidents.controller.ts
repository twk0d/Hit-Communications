import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../../auth/infra/guards/jwt-auth.guard';
import { IncidentOutput } from '../../application/dtos/incident-output';
import { CreateIncidentUseCase } from '../../application/use-cases/create-incident.use-case';
import { CreateIncidentDto } from '../dtos/create-incident.dto';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(private readonly createIncidentUseCase: CreateIncidentUseCase) {}

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
}
