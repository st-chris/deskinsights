import mongoose from 'mongoose';
import { z } from 'zod';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
  },
  name: String,
  passwordHash: String,
  refreshToken: {
    type: String,
    default: null,
  },
});

userSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject.id = (
      returnedObject._id as mongoose.Types.ObjectId
    ).toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  },
});

const UserSchema = mongoose.model('User', userSchema);

export default UserSchema;

export interface User {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  refreshToken?: string | null;
}

export const UserLoginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type UserLogin = z.infer<typeof UserLoginSchema>;

export const UserRegistrationSchema = z
  .object({
    email: z.email('Invalid email address'),
    name: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters long'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
