import { SetMetadata } from '@nestjs/common';

export const LOG_OPERATION_METADATA = 'hit:log-operation';

export function LogOperation(operation: string): MethodDecorator {
  return SetMetadata(LOG_OPERATION_METADATA, operation);
}
