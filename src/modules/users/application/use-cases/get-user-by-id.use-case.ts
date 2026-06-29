import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { UserOutput, toUserOutput } from '../dtos/user-output';
import { UsersRepository } from '../../domain/repositories/users.repository';

export type GetUserByIdInput = {
  id: string;
};

export class GetUserByIdUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(input: GetUserByIdInput): Promise<UserOutput> {
    const user = await this.usersRepository.findById(input.id);

    if (!user || user.deletedAt !== null) {
      throw new ResourceNotFoundError('User not found');
    }

    return toUserOutput(user);
  }
}
