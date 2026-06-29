import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
    })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name must be at most 120 characters'),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .trim()
    .email('Email must be valid')
    .max(255, 'Email must be at most 255 characters'),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export class RegisterUserDto {
  static readonly schema = registerUserSchema;

  name!: string;
  email!: string;
  password!: string;
}
