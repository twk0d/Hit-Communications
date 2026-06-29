import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ZodTypeAny } from 'zod';

type ZodDto = {
  schema?: ZodTypeAny;
};

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const schema = this.resolveSchema(metadata.metatype);

    if (!schema) {
      return value;
    }

    const result = schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    throw new UnprocessableEntityException({
      statusCode: 422,
      message: 'Validation failed',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.') || metadata.data || metadata.type,
        message: issue.message,
      })),
    });
  }

  private resolveSchema(metatype: ArgumentMetadata['metatype']): ZodTypeAny | undefined {
    return (metatype as ZodDto | undefined)?.schema;
  }
}
