import AsyncStorage from '../utils/safeStorage';

const SECURITY_STORAGE_KEY = '@stockpot_auth_security';
export const MAX_LOGIN_ATTEMPTS = 5;
export const DEFAULT_LOCKOUT_SECONDS = 60;
const ATTEMPT_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes of inactivity resets attempt count

/**
 * Reads persistent lockout and failed attempt state from local storage.
 * Automatically checks timestamp expiry so closing and reopening the app
 * preserves active lockouts.
 */
export const getLockoutState = async () => {
  try {
    const raw = await AsyncStorage.getItem(SECURITY_STORAGE_KEY);
    if (!raw) {
      return { isLocked: false, lockoutSecondsLeft: 0, failedAttempts: 0 };
    }

    const data = JSON.parse(raw);
    const now = Date.now();

    // Check if currently under active lockout
    if (data.lockoutUntil && data.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((data.lockoutUntil - now) / 1000);
      return {
        isLocked: true,
        lockoutSecondsLeft: remainingSeconds,
        failedAttempts: MAX_LOGIN_ATTEMPTS,
        lockedEmail: data.email || '',
      };
    }

    // If lockout has elapsed, clear lockout timestamp
    if (data.lockoutUntil && data.lockoutUntil <= now) {
      await clearLockoutState();
      return { isLocked: false, lockoutSecondsLeft: 0, failedAttempts: 0 };
    }

    // Check if non-locked failed attempts have expired
    if (data.lastAttemptAt && now - data.lastAttemptAt > ATTEMPT_EXPIRY_MS) {
      await clearLockoutState();
      return { isLocked: false, lockoutSecondsLeft: 0, failedAttempts: 0 };
    }

    return {
      isLocked: false,
      lockoutSecondsLeft: 0,
      failedAttempts: Number(data.failedAttempts) || 0,
      lockedEmail: data.email || '',
    };
  } catch (_) {
    return { isLocked: false, lockoutSecondsLeft: 0, failedAttempts: 0 };
  }
};

/**
 * Records a failed login attempt. If attempts reach MAX_LOGIN_ATTEMPTS (5),
 * initiates persistent lockout.
 */
export const recordFailedAttempt = async (email = '') => {
  try {
    const current = await getLockoutState();
    const now = Date.now();
    const nextAttempts = (current.failedAttempts || 0) + 1;

    if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = now + DEFAULT_LOCKOUT_SECONDS * 1000;
      const state = {
        failedAttempts: MAX_LOGIN_ATTEMPTS,
        lockoutUntil,
        lastAttemptAt: now,
        email: email.trim().toLowerCase(),
      };
      await AsyncStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(state));
      return {
        isLocked: true,
        lockoutSecondsLeft: DEFAULT_LOCKOUT_SECONDS,
        failedAttempts: MAX_LOGIN_ATTEMPTS,
      };
    }

    const state = {
      failedAttempts: nextAttempts,
      lockoutUntil: null,
      lastAttemptAt: now,
      email: email.trim().toLowerCase(),
    };
    await AsyncStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(state));
    return {
      isLocked: false,
      lockoutSecondsLeft: 0,
      failedAttempts: nextAttempts,
    };
  } catch (_) {
    return { isLocked: false, lockoutSecondsLeft: 0, failedAttempts: 1 };
  }
};

/**
 * Synchronizes with backend 429 Too Many Requests response.
 */
export const recordServerLockout = async (retryAfterSeconds = DEFAULT_LOCKOUT_SECONDS, email = '') => {
  try {
    const duration = Math.max(5, Number(retryAfterSeconds) || DEFAULT_LOCKOUT_SECONDS);
    const now = Date.now();
    const lockoutUntil = now + duration * 1000;
    const state = {
      failedAttempts: MAX_LOGIN_ATTEMPTS,
      lockoutUntil,
      lastAttemptAt: now,
      email: email.trim().toLowerCase(),
    };
    await AsyncStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(state));
    return {
      isLocked: true,
      lockoutSecondsLeft: duration,
      failedAttempts: MAX_LOGIN_ATTEMPTS,
    };
  } catch (_) {
    return {
      isLocked: true,
      lockoutSecondsLeft: retryAfterSeconds || DEFAULT_LOCKOUT_SECONDS,
      failedAttempts: MAX_LOGIN_ATTEMPTS,
    };
  }
};

/**
 * Clears lockout and reset attempts upon successful login or verified password reset.
 */
export const clearLockoutState = async () => {
  try {
    await AsyncStorage.removeItem(SECURITY_STORAGE_KEY);
  } catch (_) {}
};

export default {
  getLockoutState,
  recordFailedAttempt,
  recordServerLockout,
  clearLockoutState,
  MAX_LOGIN_ATTEMPTS,
  DEFAULT_LOCKOUT_SECONDS,
};
