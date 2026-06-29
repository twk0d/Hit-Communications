import { Clock } from '../../../../shared/application/clock/clock';
import { ConflictError } from '../../../../shared/application/errors/application.error';
import { IdGenerator } from '../../../../shared/application/ids/id-generator';
import { UserOutput, toUserOutput } from '../../../users/application/dtos/user-output';
import { User } from '../../../users/domain/entities/user.entity';
import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';
import { PasswordHasher } from '../contracts/password-hasher';

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export class RegisterUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RegisterUserInput): Promise<UserOutput> {
    const email = normalizeEmail(input.email);
    const existingUser = await this.usersRepository.findByEmailIncludingDeleted(email);

    if (existingUser) {
      throw new ConflictError('Email is already in use');
    }

    const now = this.clock.now();
    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = User.create({
      id: this.idGenerator.generate(),
      name: input.name,
      email,
      passwordHash,
      role: UserRole.USER,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    const createdUser = await this.usersRepository.create(user);

    return toUserOutput(createdUser);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
