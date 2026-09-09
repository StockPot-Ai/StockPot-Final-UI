import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Local IP detected from ipconfig:
const DEV_LAN_IP = '172.22.0.103';

// Dynamically extract host IP from Expo Metro bundler if available
const getHostIp = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  return DEV_LAN_IP;
};

const HOST_IP = getHostIp();

export const API_BASE_URL = Platform.select({
  web: 'http://localhost:5000/api',
  android: `http://${HOST_IP}:5000/api`,
  ios: `http://${HOST_IP}:5000/api`,
  default: `http://${HOST_IP}:5000/api`,
});

let authToken = 'mock-token';

export const setAuthToken = (token) => {
  authToken = token || 'mock-token';
};

export const getAuthToken = () => authToken;

const defaultHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (data && data.error && data.error.message) ||
      (typeof data === 'string' ? data : `Request failed with status ${response.status}`);
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const apiClient = {
  get: async (endpoint, customHeaders = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { ...defaultHeaders(), ...customHeaders },
    });
    return handleResponse(response);
  },

  post: async (endpoint, body = {}, customHeaders = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...defaultHeaders(), ...customHeaders },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  patch: async (endpoint, body = {}, customHeaders = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { ...defaultHeaders(), ...customHeaders },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  delete: async (endpoint, customHeaders = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { ...defaultHeaders(), ...customHeaders },
    });
    return handleResponse(response);
  },
};

export default apiClient;
