import { check, fail } from 'k6';

import { BASE_URL, EMAIL, PASSWORD } from '../config.js';
import { apiPost, safeJson } from './http.js';

export function login() {
  const response = apiPost(
    '/auth/login',
    {
      email: EMAIL,
      password: PASSWORD,
    },
    undefined,
    {
      name: 'POST /auth/login',
      operation: 'auth.login',
    },
    [200],
  );
  const body = safeJson(response);
  const accessToken = body && body.accessToken;

  check(response, {
    'login returned accessToken': () =>
      typeof accessToken === 'string' && accessToken.length > 0,
  });

  if (!accessToken) {
    fail(`Unable to authenticate against ${BASE_URL}/auth/login`);
  }

  return {
    accessToken,
    user: body.user,
  };
}
