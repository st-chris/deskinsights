import Router from 'express';
import * as authController from '../controllers/auth';
import { validate } from '../utils/middleware';
import { UserLoginSchema } from '../models/user';
import rateLimit from 'express-rate-limit';

const authRouter = Router();

// Anti-brute force
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'test' ? 10000 : 5, // 5 attempts/IP
  message: { error: 'Too many login attempts. Wait 1 hour.' },
  standardHeaders: true,
});

// Login route
authRouter.post(
  '/',
  loginLimiter,
  validate(UserLoginSchema),
  authController.login
);

// Refresh token route
authRouter.post(
  '/refresh',
  rateLimit({ max: 20, windowMs: 15 * 60 * 1000 }),
  authController.refresh
);

// Logout route
authRouter.post('/logout', authController.logout);

export default authRouter;
