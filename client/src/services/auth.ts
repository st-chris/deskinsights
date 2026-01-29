import api from './api';
import type { LoginFormData } from '../utils/validationSchema';
const baseUrl = 'http://localhost:3001/api/auth';

const getTokenFromLocalStorage = () => {
  const loggedUserJSON = localStorage.getItem('loggedUser');
  if (loggedUserJSON) {
    const user = JSON.parse(loggedUserJSON);
    return user.token;
  }
  return null;
};

const login = async (loginData: LoginFormData) => {
  const { email, password } = loginData;

  const response = await api.post(baseUrl, { email, password });

  localStorage.setItem('loggedUser', JSON.stringify(response.data));
  return response.data;
};

const refreshToken = async () => {
  const response = await api.post(`${baseUrl}/refresh`);

  if (response.data.token) {
    localStorage.setItem('loggedUser', JSON.stringify(response.data));
  }

  return response.data;
};

const logout = async () => {
  localStorage.removeItem('loggedUser');

  const response = await api.post(`${baseUrl}/logout`);

  return response;
};

export default { getTokenFromLocalStorage, login, refreshToken, logout };
