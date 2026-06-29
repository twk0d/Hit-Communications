import { z } from 'zod';

export const loginSchema = z.object({
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
    .min(1, 'Password is required')
    .max(72, 'Password must be at most 72 characters'),
});

export class LoginDto {
  static readonly schema = loginSchema;

  email!: string;
  password!: string;
}
