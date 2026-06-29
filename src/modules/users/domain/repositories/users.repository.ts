import { User } from '../entities/user.entity';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UsersRepository {
  findMany(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
}
