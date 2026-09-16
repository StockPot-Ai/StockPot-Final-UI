import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '../utils/safeStorage';

// Production Live Backend URL on Railway:
export const PRODUCTION_API_URL = 'https://stockpot-ai-mobile-backend-final-production.up.railway.app/api';

const isIPv4 = (str) => {
  if (!str) return false;
  const parts = str.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return !isNaN(n) && n >= 0 && n <= 255;
  });
};

export const formatApiUrl = (input) => {
  if (!input) return PRODUCTION_API_URL;
  let clean = String(input).trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    if (!clean.endsWith('/api') && !clean.includes('/api/')) {
      clean = `${clean}/api`;
    }
    return clean;
  }
  return `http://${clean}:5000/api`;
};

export const API_URL_STORAGE_KEY = '@stockpot_custom_api_url';

let customBaseUrl = PRODUCTION_API_URL;

// Immediately load saved custom server URL if previously configured,
// but automatically migrate away from stale local development IPs to Railway Production:
AsyncStorage.getItem(API_URL_STORAGE_KEY)
  .then((saved) => {
    if (saved && typeof saved === 'string' && saved.startsWith('http')) {
      const isStaleLocal =
        saved.includes('172.22.') ||
        saved.includes('192.168.') ||
        saved.includes('10.4.2.') ||
        saved.includes('localhost') ||
        saved.includes('127.0.0.1');

      if (isStaleLocal) {
        customBaseUrl = PRODUCTION_API_URL;
        AsyncStorage.setItem(API_URL_STORAGE_KEY, PRODUCTION_API_URL).catch(() => {});
        console.log('[API] Upgraded stale local IP to Railway Production URL:', customBaseUrl);
      } else {
        customBaseUrl = formatApiUrl(saved);
        console.log('[API] Using saved Base URL:', customBaseUrl);
      }
    } else {
      AsyncStorage.setItem(API_URL_STORAGE_KEY, PRODUCTION_API_URL).catch(() => {});
    }
  })
  .catch(() => { });

export const getApiBaseUrl = () => customBaseUrl;

export const setApiBaseUrl = async (newUrl) => {
  if (newUrl && typeof newUrl === 'string') {
    let clean = newUrl.trim();
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    if (!clean.endsWith('/api') && !clean.includes('/api/')) {
      clean = `${clean}/api`;
    }
    customBaseUrl = clean;
    try {
      await AsyncStorage.setItem(API_URL_STORAGE_KEY, clean);
    } catch (_) { }
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
    const retryHeader = response.headers?.get?.('retry-after');
    error.retryAfter =
      (retryHeader ? Number(retryHeader) : null) ||
      (data && typeof data === 'object' && (data.retry_after || data.retryAfter)) ||
      null;
    throw error;
  }

  return data;
}

const sanitizeHeaders = (rawHeaders = {}) => {
  const clean = { ...defaultHeaders() };
  if (rawHeaders && typeof rawHeaders === 'object') {
    Object.keys(rawHeaders).forEach((k) => {
      const v = rawHeaders[k];
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        clean[k] = String(v);
      }
    });
  }
  return clean;
};

const buildUrlWithParams = (endpoint, options = {}) => {
  let params = null;
  if (options && typeof options === 'object') {
    if (options.params && typeof options.params === 'object') {
      params = options.params;
    }
  }
  let base = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;
  if (params && typeof params === 'object') {
    const queryParts = [];
    Object.keys(params).forEach((key) => {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
      }
    });
    if (queryParts.length > 0) {
      const sep = base.includes('?') ? '&' : '?';
      base += `${sep}${queryParts.join('&')}`;
    }
  }
  return base;
};

const createNetworkError = (err, url) => {
  const isNetwork =
    !err.status &&
    err.message &&
    (err.message.includes('fetch failed') ||
      err.message.includes('Network request failed') ||
      err.message.includes('ConnectException') ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('Failed to connect'));
  if (isNetwork) {
    const host = url.split('/api')[0];
    const error = new Error(`Cannot reach server at ${host}. Please check backend connection.`);
    error.originalError = err;
    error.url = url;
    return error;
  }
  err.url = url;
  return err;
};

export const apiClient = {
  get: async (endpoint, optionsOrHeaders = {}) => {
    const url = buildUrlWithParams(endpoint, optionsOrHeaders);
    const customHeaders = optionsOrHeaders?.headers || optionsOrHeaders || {};
    const finalHeaders = sanitizeHeaders(customHeaders);
    addLog('request', `GET ${url}`);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: finalHeaders,
      });
      return await handleResponse(response, url);
    } catch (err) {
      addLog('error', `GET ${url} failed: ${err.message}`, { url, error: err.toString() });
      throw createNetworkError(err, url);
    }
  },

  post: async (endpoint, body = {}, customHeaders = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;
    const finalHeaders = sanitizeHeaders(customHeaders);
    addLog('request', `POST ${url}`, body);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: finalHeaders,
        body: JSON.stringify(body),
      });
      return await handleResponse(response, url);
    } catch (err) {
      addLog('error', `POST ${url} failed: ${err.message}`, { url, body, error: err.toString() });
      throw createNetworkError(err, url);
    }
  },

  patch: async (endpoint, body = {}, customHeaders = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;
    const finalHeaders = sanitizeHeaders(customHeaders);
    addLog('request', `PATCH ${url}`, body);
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: finalHeaders,
        body: JSON.stringify(body),
      });
      return await handleResponse(response, url);
    } catch (err) {
      addLog('error', `PATCH ${url} failed: ${err.message}`, { url, body, error: err.toString() });
      throw createNetworkError(err, url);
    }
  },

  delete: async (endpoint, customHeaders = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;
    const finalHeaders = sanitizeHeaders(customHeaders);
    addLog('request', `DELETE ${url}`);
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: finalHeaders,
      });
      return await handleResponse(response, url);
    } catch (err) {
      addLog('error', `DELETE ${url} failed: ${err.message}`, { url, error: err.toString() });
      throw createNetworkError(err, url);
    }
  },
};

export default apiClient;
