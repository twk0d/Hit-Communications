import { ArgumentMetadata, UnprocessableEntityException } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from './zod-validation.pipe';

class ExampleDto {
  static readonly schema = z.object({
    title: z.string().min(1, 'Title is required'),
  });
}

describe('ZodValidationPipe', () => {
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: ExampleDto,
  };

  it('returns parsed data when the payload is valid', () => {
    const pipe = new ZodValidationPipe();

    expect(pipe.transform({ title: 'Incident title' }, metadata)).toEqual({
      title: 'Incident title',
    });
  });

  it('throws a 422 response with field errors when the payload is invalid', () => {
    const pipe = new ZodValidationPipe();

    try {
      pipe.transform({ title: '' }, metadata);
      fail('Expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect((error as UnprocessableEntityException).getResponse()).toEqual({
        statusCode: 422,
        message: 'Validation failed',
        errors: [
          {
            field: 'title',
            message: 'Title is required',
          },
        ],
      });
    }
  });
});
