import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';
const api = axios.create({
  baseURL: `${API_BASE}/api`, 
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default api;
