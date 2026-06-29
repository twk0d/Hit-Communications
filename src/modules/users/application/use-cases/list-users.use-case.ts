import { UserOutput, toUserOutput } from '../dtos/user-output';
import { UsersRepository } from '../../domain/repositories/users.repository';

export class ListUsersUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(): Promise<UserOutput[]> {
    const users = await this.usersRepository.findMany();

    return users.filter((user) => user.deletedAt === null).map(toUserOutput);
  }
}
