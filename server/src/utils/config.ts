import dotenv from 'dotenv';
import { CookieOptions } from 'express';

dotenv.config();

const PORT = process.env.PORT;
const MONGODB_URI =
  process.env.NODE_ENV === 'test'
    ? process.env.MONGODB_URI_TEST
    : process.env.MONGODB_URI;

const allowedOrigins = ['http://localhost:5173'];

const cookiePreferences: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
};

export default { PORT, MONGODB_URI, allowedOrigins, cookiePreferences };
