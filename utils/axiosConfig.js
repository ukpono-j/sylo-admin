import axios from 'axios';
import { debounce } from 'lodash';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Store cancel token source
let cancelTokenSource = axios.CancelToken.source();
let isLoggingOut = false; // Flag to prevent multiple logout triggers

// Debounced logout function
const handleLogout = debounce(() => {
  if (isLoggingOut) return; // Prevent multiple logout calls
  isLoggingOut = true;
  localStorage.removeItem('adminToken');
  // Cancel all pending requests
  cancelTokenSource.cancel('Operation canceled due to logout or token expiration.');
  // Reset cancel token source for future requests
  cancelTokenSource = axios.CancelToken.source();
  // Trigger logout event for ProtectedRoute to handle navigation
  window.dispatchEvent(new Event('logout'));
}, 300);

// Request interceptor to add token to headers and cancel token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach cancel token to all requests
    config.cancelToken = cancelTokenSource.token;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle canceled requests gracefully
    if (axios.isCancel(error)) {
      return Promise.reject(new Error('Request canceled due to logout or token expiration.'));
    }

    // Prevent redirect loop if already on login page
    if (window.location.pathname === '/login') {
      return Promise.reject(error);
    }

    // Check if error is due to token expiration or authentication failure
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401 && (
        data?.tokenExpired ||
        data?.error?.includes('expired') ||
        data?.error?.includes('Invalid token')
      )) {
        if (!isLoggingOut) {
          console.log('Token expired, logging out...');
          handleLogout();
        }
        return Promise.reject(new Error('Session expired. Please login again.'));
      }

      if (status === 401) {
        if (!isLoggingOut) {
          console.log('Authentication failed, logging out...');
          handleLogout();
        }
        return Promise.reject(new Error('Authentication failed. Please login again.'));
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;