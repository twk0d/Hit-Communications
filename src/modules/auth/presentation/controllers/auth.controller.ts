import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';

import { UserOutput } from '../../../users/application/dtos/user-output';
import { AuthOutput } from '../../application/dtos/auth-output';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { JwtAuthGuard } from '../../infra/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../infra/types/authenticated-user';
import { CurrentUser } from '../decorators/current-user.decorator';
import { LoginDto } from '../dtos/login.dto';
import { RegisterUserDto } from '../dtos/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Post('register')
  register(@Body() body: RegisterUserDto): Promise<UserOutput> {
    return this.registerUserUseCase.execute({
      name: body.name,
      email: body.email,
      password: body.password,
    });
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto): Promise<AuthOutput> {
    return this.loginUseCase.execute({
      email: body.email,
      password: body.password,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserOutput> {
    return this.getMeUseCase.execute({
      userId: user.id,
    });
  }
}
