import { Clock } from './clock';

export class FixedClock implements Clock {
  private currentDate: Date;

  constructor(currentDate: Date) {
    this.currentDate = new Date(currentDate);
  }

  now(): Date {
    return new Date(this.currentDate);
  }

  set(currentDate: Date): void {
    this.currentDate = new Date(currentDate);
  }
}
