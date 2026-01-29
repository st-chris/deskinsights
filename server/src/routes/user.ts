import { Router } from 'express';
import { isAuthenticated, validate } from '../utils/middleware';
import { UserRegistrationSchema } from '../models/user';
import * as usersController from '../controllers/user';

const userRouter = Router();

// Create new user route
userRouter.post(
  '/',
  validate(UserRegistrationSchema),
  usersController.createUser
);

// Get user from token route
userRouter.get('/me', isAuthenticated, usersController.getUserFromToken);

// Get all users route
userRouter.get('/', isAuthenticated, usersController.getAllUsers);

export default userRouter;
