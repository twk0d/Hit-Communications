import { UserRole } from '../../../users/domain/enums/user-role.enum';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export interface TokenService {
  signAccessToken(payload: AccessTokenPayload): Promise<string>;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
