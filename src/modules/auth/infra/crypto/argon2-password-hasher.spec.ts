import { Argon2PasswordHasher } from './argon2-password-hasher';

describe('Argon2PasswordHasher', () => {
  it('hashes passwords with Argon2id and verifies matching passwords', async () => {
    const hasher = new Argon2PasswordHasher();

    const hash = await hasher.hash('User123!');

    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(hasher.verify(hash, 'User123!')).resolves.toBe(true);
  });

  it('rejects non-matching passwords', async () => {
    const hasher = new Argon2PasswordHasher();
    const hash = await hasher.hash('User123!');

    await expect(hasher.verify(hash, 'WrongPassword123!')).resolves.toBe(false);
  });
});
