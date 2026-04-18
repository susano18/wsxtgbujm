import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we are already on a login page or if the error is from a login attempt
      const isLoginAttempt = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/student/login');

      if (!isLoginAttempt) {
        const userStr = localStorage.getItem('user');
        let redirectPath = '/';

        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.role === 'student') {
              redirectPath = '/student/login';
            }
          } catch (e) {
            console.error('Failed to parse user from localStorage', e);
          }
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (typeof window !== 'undefined') {
          window.location.href = redirectPath;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
