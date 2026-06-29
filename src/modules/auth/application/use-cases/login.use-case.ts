import { UnauthorizedError } from '../../../../shared/application/errors/application.error';
import { UserOutput, toUserOutput } from '../../../users/application/dtos/user-output';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';
import { AuthOutput } from '../dtos/auth-output';
import { PasswordHasher } from '../contracts/password-hasher';
import { TokenService } from '../contracts/token-service';

export type LoginInput = {
  email: string;
  password: string;
};

export class LoginUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<AuthOutput> {
    const email = normalizeEmail(input.email);
    const user = await this.usersRepository.findByEmail(email);

    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const passwordMatches = await this.passwordHasher.verify(user.passwordHash, input.password);

    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const userOutput: UserOutput = toUserOutput(user);
    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      user: userOutput,
    };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
