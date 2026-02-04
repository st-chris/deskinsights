import express from 'express';
import cors from 'cors';
import mongoose, { Error } from 'mongoose';
import config from './utils/config';
import logger from './utils/logger';
import middleware from './utils/middleware';
import authRouter from './routes/auth';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user';
import documentRouter from './routes/document';
import workspaceRouter from './routes/workspace';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import aiRouter from './routes/ai';

const app = express();

logger.info('connecting to', config.MONGODB_URI);

if (!config.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in config');
}

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB');
  })
  .catch((error: Error) => {
    logger.error('error connecting to MongoDB:', error.message);
  });

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 100,
});
const workspaceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 5000 : 50,
});
const documentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 7500 : 75,
});
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 2000 : 20,
});
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  message: 'Too many AI requests. Please try again later.',
});

app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for React (CSP blocks inline styles)
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        config.allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        // Allow all Vercel preview URLs
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);
app.use(express.static('dist'));
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);
app.use(middleware.requestLogger);
app.use(middleware.extractToken);

app.use('/api/users', userLimiter, userRouter);
app.use('/api/auth', authRouter);
app.use('/api/documents', documentLimiter, documentRouter);
app.use('/api/workspaces', workspaceLimiter, workspaceRouter);
app.use('/api/ai', aiLimiter, aiRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

export default app;
