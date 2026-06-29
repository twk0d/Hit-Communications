import { UserRole } from '../../../users/domain/enums/user-role.enum';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};
