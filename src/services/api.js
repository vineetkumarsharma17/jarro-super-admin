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

export const setActiveEnvKey = (newKey) => {
  if (ENV_CONFIG[newKey]) {
    const currentKey = getActiveEnvKey();

    // 1. Save current environment session
    const currentToken = localStorage.getItem('token');
    const currentUser = localStorage.getItem('user');
    if (currentToken) localStorage.setItem(`token_${currentKey}`, currentToken);
    if (currentUser) localStorage.setItem(`user_${currentKey}`, currentUser);

    // 2. Set new active environment key
    localStorage.setItem('super_env', newKey);

    // 3. Restore target environment session (if available)
    const targetToken = localStorage.getItem(`token_${newKey}`);
    const targetUser = localStorage.getItem(`user_${newKey}`);

    if (targetToken && targetUser) {
      localStorage.setItem('token', targetToken);
      localStorage.setItem('user', targetUser);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    // 4. Reload page to hydrate state cleanly
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

// Response interceptor to handle errors & auto-redirect on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const activeEnv = getActiveEnvKey();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem(`token_${activeEnv}`);
      localStorage.removeItem(`user_${activeEnv}`);
      
      if (!window.location.hash.includes('/login')) {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
