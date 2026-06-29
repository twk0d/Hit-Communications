import { User } from './user.entity';
import { UserRole } from '../enums/user-role.enum';

describe('User', () => {
  it('creates a user aggregate snapshot without exposing mutable dates', () => {
    const createdAt = new Date('2026-06-29T12:00:00.000Z');

    const user = User.create({
      id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
      name: 'HIT User',
      email: 'user@hit.local',
      passwordHash: 'argon2id-hash',
      role: UserRole.USER,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    });

    const snapshot = user.toSnapshot();

    snapshot.createdAt.setFullYear(2030);

    expect(user.createdAt).toEqual(createdAt);
    expect(user.email).toBe('user@hit.local');
    expect(user.deletedAt).toBeNull();
  });
});
