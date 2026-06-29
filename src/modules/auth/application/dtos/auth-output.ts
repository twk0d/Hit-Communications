import { UserOutput } from '../../../users/application/dtos/user-output';

export type AuthOutput = {
  accessToken: string;
  tokenType: 'Bearer';
  user: UserOutput;
};
