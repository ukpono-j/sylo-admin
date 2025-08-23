// utils/axiosConfig.js
import axios from 'axios';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Function to handle logout
const handleLogout = () => {
  localStorage.removeItem('adminToken');
  window.location.href = '/login';
};

// Request interceptor to add token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if error is due to token expiration
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle token expiration
      if (status === 401 && (
        data?.tokenExpired || 
        data?.error?.includes('expired') || 
        data?.error?.includes('Invalid token')
      )) {
        console.log('Token expired, logging out...');
        handleLogout();
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
      
      // Handle other authentication errors
      if (status === 401) {
        console.log('Authentication failed, logging out...');
        handleLogout();
        return Promise.reject(new Error('Authentication failed. Please login again.'));
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;