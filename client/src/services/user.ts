import type { RegisterFormData } from '../utils/validationSchema';
import api from './api';
import type { User } from '../models/user';

const baseUrl = '/users';

// Register new user
const register = async (registerData: RegisterFormData): Promise<User> => {
  const { email, password, confirmPassword, name } = registerData;
  const response = await api.post(baseUrl, {
    email,
    password,
    confirmPassword,
    name,
  });
  return response.data;
};

// Get current logged-in user
const getLoggedUser = async (): Promise<User> => {
  const response = await api.get(`${baseUrl}/me`);
  return response.data;
};

const userService = {
  register,
  getLoggedUser,
};

export default userService;
