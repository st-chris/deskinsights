import { NextFunction, Request, Response } from 'express';
import logger from './logger';
import { ZodSchema } from 'zod';
import * as jwt from 'jsonwebtoken';
import config from './config';

// Extend Express Request interface to include 'token'
declare module 'express-serve-static-core' {
  interface Request {
    token?: string | null;
    userId?: string;
  }
}

const requestLogger = (
  request: Request,
  _response: Response,
  next: NextFunction
) => {
  logger.info('Method:', request.method);
  logger.info('Path:  ', request.path);
  logger.info('Body:  ', request.body);
  logger.info('---');
  next();
};

const extractToken = (
  request: Request,
  _response: Response,
  next: NextFunction
) => {
  const authorization = request.get('authorization');
  if (authorization && authorization.startsWith('Bearer ')) {
    request.token = authorization.replace('Bearer ', '');
  } else {
    request.token = null;
  }
  next();
};

export const isAuthenticated = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const token = request.token;

  if (!token || typeof process.env.SECRET !== 'string') {
    response.status(401).json({ error: 'Token missing or invalid' });
    return;
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.SECRET);
  } catch (error) {
    next(error);
    return;
  }

  if (
    !decodedToken ||
    typeof decodedToken !== 'object' ||
    !('id' in decodedToken)
  ) {
    response.status(401).json({ error: 'Token missing or invalid' });
    return;
  }

  request.userId = (decodedToken as { id: string }).id;

  next();
};

/**
 * Middleware to validate request body against a Zod schema.
 * If validation fails, it responds with a 400 status and error messages.
 */
export const validate =
  (validationSchema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = validationSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessages = result.error.issues
        .map((issue) => issue.message)
        .join(', ');
      next({
        name: 'ValidationError',
        message: errorMessages,
      });
    }

    next();
  };

const unknownEndpoint = (_request: Request, response: Response) => {
  response.status(404).send({ error: 'Unknown endpoint' });
};

const errorHandler = (
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction
) => {
  logger.error(error.message);

  switch (error.name) {
    case 'ValidationError':
      if (error.message === 'Required') {
        response.status(400).json({ error: 'Email and password are required' });
        return;
      }
      response.status(400).json({ error: error.message });
      return;
    case 'MongoServerError':
      if (error.message.includes('E11000 duplicate key error')) {
        response.status(400).json({ error: 'Expected `email` to be unique' });
        return;
      }
      break;
    case 'JsonWebTokenError':
      response.status(401).json({ error: 'Invalid token' });
      return;
    case 'TokenExpiredError':
      if (
        request.path === '/api/auth/refresh' ||
        request.path === '/api/auth/logout'
      ) {
        response.clearCookie('refreshToken', config.cookiePreferences);
        response.status(401).json({ error: 'Refresh token expired' });
        return;
      }

      response.status(401).json({ error: 'Token expired' });
      return;

    default:
      break;
  }

  next(error);
};

export default {
  requestLogger,
  extractToken,
  unknownEndpoint,
  errorHandler,
};
