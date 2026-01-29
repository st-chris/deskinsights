import * as bcrypt from 'bcrypt';
import UserSchema, { UserRegistration } from '../models/user';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

// Create a new user
export const createUser = async (
  request: Request<object, object, UserRegistration>,
  response: Response
): Promise<void> => {
  const { email, name, password } = request.body;

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new UserSchema({
    email,
    name,
    passwordHash,
  });

  const savedUser = await user.save();
  response.status(201).json(savedUser);
  return;
};

// Get user from token
export const getUserFromToken = async (
  request: Request,
  response: Response
): Promise<void> => {
  const token = request.token;
  if (!token || typeof process.env.SECRET !== 'string') {
    response.status(401).json({ error: 'Token missing or invalid' });
    return;
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.SECRET);
  } catch {
    response.status(401).json({ error: 'Token missing or invalid' });
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

  const user = await UserSchema.findById(decodedToken.id);
  if (!user) {
    response.status(404).json({ error: 'User not found' });
    return;
  }

  response.status(200).json(user);
  return;
};

// Get all users
export const getAllUsers = async (
  _request: Request,
  response: Response
): Promise<void> => {
  const users = await UserSchema.find({});
  response.json(users);
  return;
};
