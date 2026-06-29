import { ConfigService } from '@nestjs/config';

import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { JwtStrategy } from './jwt.strategy';

function makeConfigService(secret: string | undefined): ConfigService {
  return {
    get: jest.fn().mockReturnValue(secret),
  } as unknown as ConfigService;
}

describe('JwtStrategy', () => {
  it('maps access token payload to authenticated user', () => {
    const strategy = new JwtStrategy(makeConfigService('test-secret'));

    expect(
      strategy.validate({
        sub: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
        email: 'user@hit.local',
        role: UserRole.USER,
      }),
    ).toEqual({
      id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
      email: 'user@hit.local',
      role: UserRole.USER,
    });
  });

  it('fails fast when JWT_SECRET is missing', () => {
    expect(() => new JwtStrategy(makeConfigService(undefined))).toThrow(
      'JWT_SECRET is required',
    );
  });
});
