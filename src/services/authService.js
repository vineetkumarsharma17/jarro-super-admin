import api, { getActiveEnvKey } from './api';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      const activeEnv = getActiveEnvKey();
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem(`token_${activeEnv}`, response.data.token);
      localStorage.setItem(`user_${activeEnv}`, JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    const activeEnv = getActiveEnvKey();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(`token_${activeEnv}`);
    localStorage.removeItem(`user_${activeEnv}`);
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    if (response.data.token) {
      const activeEnv = getActiveEnvKey();
      localStorage.setItem('token', response.data.token);
      localStorage.setItem(`token_${activeEnv}`, response.data.token);
    }
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
