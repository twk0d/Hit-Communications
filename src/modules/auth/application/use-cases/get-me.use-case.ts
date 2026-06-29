import { ResourceNotFoundError } from '../../../../shared/application/errors/application.error';
import { UserOutput, toUserOutput } from '../../../users/application/dtos/user-output';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';

export type GetMeInput = {
  userId: string;
};

export class GetMeUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(input: GetMeInput): Promise<UserOutput> {
    const user = await this.usersRepository.findById(input.userId);

    if (!user || user.deletedAt !== null) {
      throw new ResourceNotFoundError('User not found');
    }

    return toUserOutput(user);
  }
}
