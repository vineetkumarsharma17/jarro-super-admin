import axios from 'axios';

export const ENV_CONFIG = {
  prod: {
    key: 'prod',
    label: 'PROD (api.jarro.in)',
    url: 'https://api.jarro.in/api',
    color: 'error',
  },
  dev: {
    key: 'dev',
    label: 'DEV (dev-api.jarro.in)',
    url: 'https://dev-api.jarro.in/api',
    color: 'warning',
  },
};

export const getActiveEnvKey = () => {
  return localStorage.getItem('super_env') || 'prod';
};

export const getActiveApiUrl = () => {
  const key = getActiveEnvKey();
  return ENV_CONFIG[key]?.url || ENV_CONFIG.prod.url;
};

export const setActiveEnvKey = (key) => {
  if (ENV_CONFIG[key]) {
    localStorage.setItem('super_env', key);
    window.location.reload();
  }
};

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add dynamic environment baseURL & token
api.interceptors.request.use(
  (config) => {
    config.baseURL = getActiveApiUrl();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '#/login';
    }
    return Promise.reject(error);
  }
);

export default api;
