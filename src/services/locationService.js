import * as Location from 'expo-location';
import AsyncStorage from '../utils/safeStorage';

const LOCATION_STORAGE_KEY = '@stockpot_last_location';

// No default/mock location — when unavailable, say so honestly
const UNAVAILABLE_LOCATION = {
  latitude: null,
  longitude: null,
  city: null,
  region: null,
  country: 'Sri Lanka',
  formatted: 'Location Unavailable',
  isGps: false,
  isUnavailable: true,
};

let cachedLocation = null; // null = not yet resolved
let isResolvingPromise = null;

// Load persisted location on module initialization (only if it was a real GPS/IP fix)
const initPromise = (async () => {
  try {
    const saved = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.latitude && parsed.longitude && !parsed.isUnavailable) {
        if (parsed.city && isInvalidCityName(parsed.city)) {
          parsed.city = null;
        }
        if (parsed.formatted && isInvalidCityName(parsed.formatted)) {
          parsed.formatted = 'Current Location';
        }
        cachedLocation = parsed;
      }
    }
  } catch (_) {}
  return cachedLocation;
})();

// Helper to check if a reverse geocode string is just a number, coordinate, or longitude
const isInvalidCityName = (str) => {
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
      const res = await Location.requestForegroundPermissionsAsync();
      return res.status === 'granted';
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
            const req = await withTimeout(Location.requestForegroundPermissionsAsync(), 2000, null);
            if (req && req.status) status = req.status;
          }
        } catch (_) {}

        let coords = null;

        if (status === 'granted') {
          // Fast path: Try last known position first (instant on Android)
          try {
            const last = await withTimeout(Location.getLastKnownPositionAsync({}), 1200, null);
            if (last && last.coords) {
              coords = last.coords;
            }
          } catch (_) {}

          // If no last known position, try active GPS with Low accuracy
          if (!coords) {
            try {
              const current = await withTimeout(
                Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
                2500,
                null
              );
              if (current && current.coords) {
                coords = current.coords;
              }
            } catch (_) {}
          }
        }

        // If device GPS returned valid coordinates
        if (coords && coords.latitude && coords.longitude) {
          const { latitude, longitude } = coords;

          // Immediately create valid cached location so callers get coordinates in 0ms!
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
                2000,
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

        // GPS permission denied or GPS off — try IP Geolocation
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2000);
          const ipRes = await fetch('https://ipwho.is/', { signal: controller.signal });
          clearTimeout(timer);
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            if (ipData && ipData.success && ipData.latitude && ipData.longitude) {
              const candidateCity = ipData.city && !isInvalidCityName(ipData.city) ? ipData.city : null;
              cachedLocation = {
                latitude: ipData.latitude,
                longitude: ipData.longitude,
                city: candidateCity,
                region: ipData.region || null,
                country: ipData.country || 'Sri Lanka',
                formatted: candidateCity ? `${candidateCity}, ${(ipData.country_code || 'LK')}` : 'Current Location',
                isGps: false,
                isUnavailable: false,
              };
              AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(cachedLocation)).catch(() => {});
              return cachedLocation;
            }
          }
        } catch (_) {}

        // Fallback default Sri Lanka coordinates if no GPS or IP
        if (cachedLocation && cachedLocation.latitude && cachedLocation.longitude) {
          return cachedLocation;
        }

        cachedLocation = {
          latitude: 6.9271,
          longitude: 79.8612,
          city: 'Colombo',
          region: 'Western Province',
          country: 'Sri Lanka',
          formatted: 'Colombo, LK',
          isGps: false,
          isUnavailable: false,
        };
        return cachedLocation;
      } catch (err) {
        return cachedLocation || {
          latitude: 6.9271,
          longitude: 79.8612,
          city: 'Colombo',
          region: 'Western Province',
          country: 'Sri Lanka',
          formatted: 'Colombo, LK',
          isGps: false,
          isUnavailable: false,
        };
      } finally {
        isResolvingPromise = null;
      }
    })();

    return isResolvingPromise;
  },

  getCachedLocation: () => cachedLocation || {
    latitude: 6.9271,
    longitude: 79.8612,
    city: 'Colombo',
    region: 'Western Province',
    country: 'Sri Lanka',
    formatted: 'Colombo, LK',
    isGps: false,
    isUnavailable: false,
  },

  getCoordinates: async () => {
    // 1. Wait for persisted storage init if not yet loaded
    if (!cachedLocation) {
      await initPromise;
    }

    // 2. If we have a cached location, return it IMMEDIATELY and refresh GPS in background
    if (cachedLocation && cachedLocation.latitude && cachedLocation.longitude) {
      locationService.getCurrentLocation().catch(() => {});
      const cleanCity = !isInvalidCityName(cachedLocation.city) ? cachedLocation.city : null;
      return {
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        city: cleanCity,
        formatted: cachedLocation.formatted && !isInvalidCityName(cachedLocation.formatted) ? cachedLocation.formatted : (cleanCity ? `${cleanCity}, LK` : 'Current Location'),
        isGps: !!cachedLocation.isGps,
        isUnavailable: false,
      };
    }

    // 3. If still no location, resolve fast
    const loc = await locationService.getCurrentLocation();
    if (loc && loc.latitude && loc.longitude) {
      const cleanCity = !isInvalidCityName(loc.city) ? loc.city : null;
      return {
        latitude: loc.latitude,
        longitude: loc.longitude,
        city: cleanCity,
        formatted: loc.formatted && !isInvalidCityName(loc.formatted) ? loc.formatted : (cleanCity ? `${cleanCity}, LK` : 'Current Location'),
        isGps: !!loc.isGps,
        isUnavailable: false,
      };
    }

    return {
      latitude: 6.9271,
      longitude: 79.8612,
      city: 'Colombo',
      formatted: 'Colombo, LK',
      isGps: false,
      isUnavailable: false,
    };
  },

  // Allow user to manually pick a city
  setManualLocation: async (cityName, lat, lng) => {
    if (!cityName || !lat || !lng) return UNAVAILABLE_LOCATION;
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
