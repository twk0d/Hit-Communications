import { JwtService } from '@nestjs/jwt';

import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  it('signs an access token with the configured JwtService', async () => {
    const jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: {
        expiresIn: '1h',
      },
    });
    const tokenService = new JwtTokenService(jwtService);

    const accessToken = await tokenService.signAccessToken({
      sub: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
      email: 'user@hit.local',
      role: UserRole.USER,
    });

    const payload = await jwtService.verifyAsync(accessToken, {
      secret: 'test-secret',
    });

    expect(payload).toEqual(
      expect.objectContaining({
        sub: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
        email: 'user@hit.local',
        role: UserRole.USER,
      }),
    );
    expect(payload).toHaveProperty('exp');
    expect(payload).toHaveProperty('iat');
  });
});
