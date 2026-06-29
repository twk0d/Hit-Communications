import { FixedClock } from './fixed-clock';

describe('FixedClock', () => {
  it('returns a defensive copy of the configured date', () => {
    const fixedDate = new Date('2026-06-29T12:00:00.000Z');
    const clock = new FixedClock(fixedDate);

    const firstNow = clock.now();
    firstNow.setFullYear(2030);

    expect(clock.now()).toEqual(fixedDate);
  });

  it('allows changing the current date for tests', () => {
    const clock = new FixedClock(new Date('2026-06-29T12:00:00.000Z'));
    const nextDate = new Date('2026-06-29T13:00:00.000Z');

    clock.set(nextDate);

    expect(clock.now()).toEqual(nextDate);
  });
});
