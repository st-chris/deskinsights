import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserSchema, { UserLogin } from '../models/user';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import config from '../utils/config';

const generateToken = (
  userData: { email: string; id: string },
  secret: string,
  type: string
): string => {
  if (type !== 'access' && type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  const tokenId = uuidv4();
  const tokenData = {
    ...userData,
    tokenId,
  };

  const token = jwt.sign(tokenData, secret, {
    expiresIn: type === 'access' ? '1h' : '7d',
  });

  return token;
};

// Login route
const login = async (request: Request, response: Response): Promise<void> => {
  const { email, password } = request.body as UserLogin;
  const user = await UserSchema.findOne({ email });
  const passwordCorrect =
    user === null || !user.passwordHash
      ? false
      : await bcrypt.compare(password, user.passwordHash);

  if (!(user && passwordCorrect)) {
    response.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  if (!process.env.SECRET || !process.env.REFRESH_SECRET) {
    response.status(401).json({ error: 'Request could not be processed' });
    return;
  }

  const id = user.id as string;
  const token = generateToken({ email, id }, process.env.SECRET, 'access');
  const refreshToken = generateToken(
    { email, id },
    process.env.REFRESH_SECRET,
    'refresh'
  );

  // Store the refresh token in the user document
  user.refreshToken = refreshToken;
  await user.save();

  response.cookie('refreshToken', refreshToken, config.cookiePreferences);

  response.status(200).send({
    token,
    email: user.email,
    name: user.name,
    id: user._id,
  });
  return;
};

const refresh = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  const cookies = request.cookies as { [key: string]: string | undefined };
  const refreshToken = cookies.refreshToken || undefined;

  if (!refreshToken || !process.env.REFRESH_SECRET) {
    response.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET) as {
      email: string;
      id: string;
      tokenId: string;
    };

    const user = await UserSchema.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      response.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
      });

      response.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    if (!process.env.SECRET) {
      response.status(401).json({ error: 'Request could not be processed' });
      return;
    }

    const userData = {
      email: user.email,
      id: user.id as string,
    };

    const newToken = generateToken(userData, process.env.SECRET, 'access');
    const newRefreshToken = generateToken(
      userData,
      process.env.REFRESH_SECRET,
      'refresh'
    );

    // Update the user's refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    response.cookie('refreshToken', newRefreshToken, config.cookiePreferences);

    response.status(200).send({
      token: newToken,
      email: user.email,
      name: user.name,
      id: user._id,
    });
  } catch (error) {
    next(error);
    return;
  }
};

const logout = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  const cookies = request.cookies as { [key: string]: string | undefined };
  const refreshToken = cookies.refreshToken || undefined;
  if (!refreshToken) {
    response.status(204).send();
    return;
  }
  try {
    if (!process.env.REFRESH_SECRET) {
      response.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET) as {
      username: string;
      id: string;
      tokenId: string;
    };

    const user = await UserSchema.findById(decoded.id);
    if (user) {
      user.refreshToken = ''; // Clear the refresh token
      await user.save();
    }

    response.clearCookie('refreshToken', config.cookiePreferences);
    response.status(204).send();
  } catch (error) {
    next(error);
    return;
  }
};

export { login, refresh, logout };
