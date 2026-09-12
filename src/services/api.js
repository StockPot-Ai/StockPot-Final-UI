import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Local IP detected from ipconfig:
const DEV_LAN_IP = '192.168.1.8';

const isIPv4 = (str) => {
  if (!str) return false;
  const parts = str.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return !isNaN(n) && n >= 0 && n <= 255;
  });
};

// Dynamically extract host IP only if it's a valid local IPv4 (not an exp.direct/ngrok tunnel domain)
const getHostIp = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const rawHost = hostUri.split(':')[0];
    if (isIPv4(rawHost) && rawHost !== 'localhost' && rawHost !== '127.0.0.1') {
      return rawHost;
    }
  }
  return DEV_LAN_IP;
};

const DEFAULT_HOST = getHostIp();

let customBaseUrl = Platform.select({
  web: 'http://localhost:5000/api',
  android: `http://${DEFAULT_HOST}:5000/api`,
  ios: `http://${DEFAULT_HOST}:5000/api`,
  default: `http://${DEFAULT_HOST}:5000/api`,
});

export const getApiBaseUrl = () => customBaseUrl;

export const setApiBaseUrl = (newUrl) => {
  if (newUrl && typeof newUrl === 'string') {
    let clean = newUrl.trim();
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    if (!clean.endsWith('/api') && !clean.includes('/api/')) {
      clean = `${clean}/api`;
    }
    customBaseUrl = clean;
    console.log('[API] Base URL updated to:', customBaseUrl);
  }
};

export const API_BASE_URL = customBaseUrl;

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token || null;
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

// Global log history for in-app debug viewing
export const apiDebugLogs = [];

const addLog = (type, message, details = null) => {
  const entry = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
    time: new Date().toLocaleTimeString(),
    type,
    message,
    details,
  };
  apiDebugLogs.unshift(entry);
  if (apiDebugLogs.length > 50) apiDebugLogs.pop();
  console.log(`[API ${type.toUpperCase()}] ${message}`, details ? JSON.stringify(details) : '');
};

async function handleResponse(response, url) {
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  addLog('response', `${response.status} ${url}`, data);

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    if (data && typeof data === 'object') {
      errorMessage =
        data.message ||
        data.error?.message ||
        (typeof data.error === 'string' ? data.error : null) ||
        data.msg ||
        JSON.stringify(data);
    } else if (typeof data === 'string' && data.length > 0) {
      errorMessage = data;
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    error.url = url;
    throw error;
  }

  return data;
}

export const apiClient = {
  get: async (endpoint, customHeaders = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;
    addLog('request', `GET ${url}`);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { ...defaultHeaders(), ...customHeaders },
      });
      return await handleResponse(response, url);
    } catch (err) {
      addLog('error', `GET ${url} failed: ${err.message}`, { url, error: err.toString() });
      err.url = url;
      throw err;
    }
  },

  post: async (endpoint, body = {}, customHeaders = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;
    addLog('request', `POST ${url}`, body);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...defaultHeaders(), ...customHeaders },
        body: JSON.stringify(body),
      });
      return await handleResponse(response, url);
    } catch (err) {
      addLog('error', `POST ${url} failed: ${err.message}`, { url, body, error: err.toString() });
      err.url = url;
      throw err;
    }
  },

  patch: async (endpoint, body = {}, customHeaders = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;
    addLog('request', `PATCH ${url}`, body);
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { ...defaultHeaders(), ...customHeaders },
        body: JSON.stringify(body),
      });
      return await handleResponse(response, url);
    } catch (err) {
      addLog('error', `PATCH ${url} failed: ${err.message}`, { url, body, error: err.toString() });
      err.url = url;
      throw err;
    }
  },

  delete: async (endpoint, customHeaders = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;
    addLog('request', `DELETE ${url}`);
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { ...defaultHeaders(), ...customHeaders },
      });
      return await handleResponse(response, url);
    } catch (err) {
      addLog('error', `DELETE ${url} failed: ${err.message}`, { url, error: err.toString() });
      err.url = url;
      throw err;
    }
  },
};

export default apiClient;
