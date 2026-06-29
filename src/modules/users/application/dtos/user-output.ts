import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';

export type UserOutput = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export function toUserOutput(user: User): UserOutput {
  const snapshot = user.toSnapshot();

  return {
    id: snapshot.id,
    name: snapshot.name,
    email: snapshot.email,
    role: snapshot.role,
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString(),
  };
}
