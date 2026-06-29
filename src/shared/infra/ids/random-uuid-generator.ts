import { randomUUID } from 'node:crypto';

import { IdGenerator } from '../../application/ids/id-generator';

export class RandomUuidGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
