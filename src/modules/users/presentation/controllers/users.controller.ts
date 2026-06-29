import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { UserOutput } from '../../application/dtos/user-output';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { JwtAuthGuard } from '../../../auth/infra/guards/jwt-auth.guard';
import { GetUserParamsDto } from '../dtos/get-user-params.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  @Get()
  list(): Promise<UserOutput[]> {
    return this.listUsersUseCase.execute();
  }

  @Get(':id')
  getById(@Param() params: GetUserParamsDto): Promise<UserOutput> {
    return this.getUserByIdUseCase.execute({
      id: params.id,
    });
  }
}
