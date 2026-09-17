import * as Location from 'expo-location';
import AsyncStorage from '../utils/safeStorage';

const LOCATION_STORAGE_KEY = '@stockpot_last_location';

// Helper: Check if coordinates are valid inside Sri Lanka bounds
export const isValidSriLankaCoords = (lat, lon) => {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (isNaN(lat) || isNaN(lon)) return false;
  // Sri Lanka bounds: Lat 5.8 to 9.9, Lon 79.5 to 82.0
  return lat >= 5.8 && lat <= 9.9 && lon >= 79.5 && lon <= 82.0;
};

// Helper: Check if a reverse geocode string is just a number, coordinate, or longitude
export const isInvalidCityName = (str) => {
  if (!str || typeof str !== 'string') return true;
  const s = str.trim();
  if (s.length < 2) return true;
  // If it starts with a number or digit (e.g. 79.8562 or 03)
  if (/^\d/.test(s)) return true;
  // If it contains decimal coordinate numbers
  if (/\d+\.\d+/.test(s)) return true;
  // Must contain at least 2 alphabet letters
  const letters = s.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 2) return true;
  if (letters.toUpperCase() === 'LK') return true;
  if (/^[\d\.\,\s\-\+°NSEWnsew]+$/.test(s)) return true;
  if (s.toLowerCase().includes('location unavailable') || s.toLowerCase().includes('unknown')) return true;
  return false;
};

// Reliable fallback when GPS is not yet acquired or permission denied
const DEFAULT_SRI_LANKA_LOCATION = {
  latitude: 6.9271,
  longitude: 79.8612,
  city: 'Colombo',
  region: 'Western Province',
  country: 'Sri Lanka',
  formatted: 'Colombo, LK',
  isGps: false,
  isUnavailable: true,
};

let cachedLocation = null; // null = not yet resolved
let isResolvingPromise = null;

// Load persisted location on module initialization
const initPromise = (async () => {
  try {
    const saved = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        parsed.latitude &&
        parsed.longitude &&
        isValidSriLankaCoords(parsed.latitude, parsed.longitude) &&
        !parsed.isUnavailable
      ) {
        if (parsed.city && isInvalidCityName(parsed.city)) {
          parsed.city = null;
        }
        if (parsed.formatted && isInvalidCityName(parsed.formatted)) {
          parsed.formatted = 'Current Location';
        }
        cachedLocation = parsed;
      } else {
        // Stale or overseas coordinates (e.g. old carrier IP fix) — clear immediately!
        AsyncStorage.removeItem(LOCATION_STORAGE_KEY).catch(() => {});
        AsyncStorage.removeItem('@stockpot_cached_nearby_stores').catch(() => {});
      }
    }
  } catch (_) {}
  return cachedLocation;
})();

// Helper to race a promise against a timeout
const withTimeout = (promise, ms, fallbackValue = null) => {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallbackValue), ms)),
  ]);
};

export const locationService = {
  hasPermission: async () => {
    try {
      const res = await Location.getForegroundPermissionsAsync();
      return res.status === 'granted';
    } catch (_) {
      return false;
    }
  },

  requestPermission: async () => {
    try {
      const res = await withTimeout(Location.requestForegroundPermissionsAsync(), 10000, null);
      return res?.status === 'granted';
    } catch (_) {
      return false;
    }
  },

  getCurrentLocation: async () => {
    if (isResolvingPromise) return isResolvingPromise;

    isResolvingPromise = (async () => {
      try {
        // 1. Check foreground permissions
        let status = 'undetermined';
        try {
          const perm = await Location.getForegroundPermissionsAsync();
          status = perm.status;
          if (status !== 'granted') {
            const req = await withTimeout(Location.requestForegroundPermissionsAsync(), 8000, null);
            if (req && req.status) status = req.status;
          }
        } catch (_) {}

        let coords = null;

        if (status === 'granted') {
          // Fast path: Try last known position first (instant on Android/iOS)
          try {
            const last = await withTimeout(
              Location.getLastKnownPositionAsync({ maxAge: 600000 }),
              1500,
              null
            );
            if (
              last?.coords?.latitude &&
              last?.coords?.longitude &&
              isValidSriLankaCoords(last.coords.latitude, last.coords.longitude)
            ) {
              coords = last.coords;
            }
          } catch (_) {}

          // Active GPS fix with Balanced accuracy and 7-second timeout for hardware lock
          try {
            const current = await withTimeout(
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
              7000,
              null
            );
            if (
              current?.coords?.latitude &&
              current?.coords?.longitude &&
              isValidSriLankaCoords(current.coords.latitude, current.coords.longitude)
            ) {
              coords = current.coords;
            }
          } catch (_) {}
        }

        // If GPS returned valid coordinates inside Sri Lanka
        if (
          coords &&
          coords.latitude &&
          coords.longitude &&
          isValidSriLankaCoords(coords.latitude, coords.longitude)
        ) {
          const { latitude, longitude } = coords;

          cachedLocation = {
            latitude,
            longitude,
            city: cachedLocation?.city || null,
            region: cachedLocation?.region || null,
            country: 'Sri Lanka',
            formatted: cachedLocation?.formatted || 'Current Location',
            isGps: true,
            isUnavailable: false,
          };
          AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(cachedLocation)).catch(() => {});

          // Reverse geocode in background without blocking
          (async () => {
            try {
              const geocodes = await withTimeout(
                Location.reverseGeocodeAsync({ latitude, longitude }),
                3000,
                null
              );
              if (Array.isArray(geocodes) && geocodes.length > 0) {
                const g = geocodes[0];
                const candidateCity = [g.district, g.city, g.subregion, g.name].find(
                  (c) => c && !isInvalidCityName(c)
                );
                if (candidateCity) {
                  cachedLocation.city = candidateCity;
                  cachedLocation.formatted = `${candidateCity}, ${g.isoCountryCode || 'LK'}`;
                  AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(cachedLocation)).catch(() => {});
                }
              }
            } catch (_) {}
          })();

          return cachedLocation;
        }

        // GPS not available: If we already have a previous GPS location in memory, KEEP IT!
        if (
          cachedLocation &&
          cachedLocation.latitude &&
          cachedLocation.longitude &&
          isValidSriLankaCoords(cachedLocation.latitude, cachedLocation.longitude)
        ) {
          return cachedLocation;
        }

        // NO IP GEOLOCATION — never guess mobile cellular IP as it points to carrier gateway or overseas
        return {
          ...DEFAULT_SRI_LANKA_LOCATION,
        };
      } catch (err) {
        if (
          cachedLocation &&
          cachedLocation.latitude &&
          cachedLocation.longitude &&
          isValidSriLankaCoords(cachedLocation.latitude, cachedLocation.longitude)
        ) {
          return cachedLocation;
        }
        return {
          ...DEFAULT_SRI_LANKA_LOCATION,
        };
      } finally {
        isResolvingPromise = null;
      }
    })();

    return isResolvingPromise;
  },

  getCachedLocation: () => {
    if (cachedLocation && isValidSriLankaCoords(cachedLocation.latitude, cachedLocation.longitude)) {
      return cachedLocation;
    }
    return {
      ...DEFAULT_SRI_LANKA_LOCATION,
    };
  },

  getCoordinates: async () => {
    // 1. Wait for persisted storage init if not yet loaded
    if (!cachedLocation) {
      await initPromise;
    }

    // 2. If we have a genuine GPS fix in cache, return it immediately & refresh in background
    if (
      cachedLocation &&
      cachedLocation.isGps &&
      isValidSriLankaCoords(cachedLocation.latitude, cachedLocation.longitude)
    ) {
      locationService.getCurrentLocation().catch(() => {});
      const cleanCity = !isInvalidCityName(cachedLocation.city) ? cachedLocation.city : null;
      return {
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        city: cleanCity,
        formatted:
          cachedLocation.formatted && !isInvalidCityName(cachedLocation.formatted)
            ? cachedLocation.formatted
            : cleanCity
            ? `${cleanCity}, LK`
            : 'Current Location',
        isGps: true,
        isUnavailable: false,
      };
    }

    // 3. If no GPS fix yet, resolve GPS directly
    const loc = await locationService.getCurrentLocation();
    if (loc && isValidSriLankaCoords(loc.latitude, loc.longitude) && loc.isGps) {
      const cleanCity = !isInvalidCityName(loc.city) ? loc.city : null;
      return {
        latitude: loc.latitude,
        longitude: loc.longitude,
        city: cleanCity,
        formatted:
          loc.formatted && !isInvalidCityName(loc.formatted)
            ? loc.formatted
            : cleanCity
            ? `${cleanCity}, LK`
            : 'Current Location',
        isGps: true,
        isUnavailable: false,
      };
    }

    // 4. Default fallback
    return {
      ...DEFAULT_SRI_LANKA_LOCATION,
    };
  },

  // Allow user to manually pick a city
  setManualLocation: async (cityName, lat, lng) => {
    if (!cityName || !lat || !lng || !isValidSriLankaCoords(lat, lng)) return DEFAULT_SRI_LANKA_LOCATION;
    cachedLocation = {
      latitude: lat,
      longitude: lng,
      city: cityName,
      region: null,
      country: 'Sri Lanka',
      formatted: `${cityName}, LK`,
      isGps: false,
      isUnavailable: false,
    };
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(cachedLocation)).catch(() => {});
    return cachedLocation;
  },
};

export default locationService;

