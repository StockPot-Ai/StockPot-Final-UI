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

// Load persisted location on module initialization (only if it was a real GPS/IP fix)
(async () => {
  try {
    const saved = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.latitude && parsed.longitude && !parsed.isUnavailable) {
        cachedLocation = parsed;
      }
    }
  } catch (_) {}
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
      const res = await Location.requestForegroundPermissionsAsync();
      return res.status === 'granted';
    } catch (_) {
      return false;
    }
  },

  getCurrentLocation: async () => {
    try {
      // 1. Check or request foreground permissions
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }

      let coords = null;

      if (status === 'granted') {
        // Fast path: Try last known position first (instant on Android)
        try {
          const last = await withTimeout(Location.getLastKnownPositionAsync({}), 1800, null);
          if (last && last.coords) {
            coords = last.coords;
          }
        } catch (_) {}

        // If no last known position, try active GPS with Low accuracy
        if (!coords) {
          try {
            const current = await withTimeout(
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
              4000,
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
        let city = null;
        let region = null;
        let formatted = null;

        // Native reverse geocode with 2.5s timeout
        try {
          const geocodes = await withTimeout(
            Location.reverseGeocodeAsync({ latitude, longitude }),
            2500,
            null
          );
          if (Array.isArray(geocodes) && geocodes.length > 0) {
            const g = geocodes[0];
            city = g.district || g.city || g.subregion || g.name;
            region = g.region || g.subregion;
            const countryCode = g.isoCountryCode || 'LK';
            if (city) {
              formatted = `${city}, ${countryCode}`;
            } else if (region) {
              formatted = `${region}, ${countryCode}`;
            }
          }
        } catch (_) {}

        // Fallback reverse geocode via OpenStreetMap Nominatim
        if (!formatted) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              {
                headers: { 'User-Agent': 'StockPot-App/1.0' },
                signal: controller.signal,
              }
            );
            clearTimeout(timer);
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              city = addr.suburb || addr.city || addr.town || addr.municipality || addr.district || addr.county;
              const countryCode = (addr.country_code || 'lk').toUpperCase();
              if (city) {
                formatted = `${city}, ${countryCode}`;
              }
            }
          } catch (_) {}
        }

        // If still no city name, use coordinate-based label
        if (!formatted) {
          formatted = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          city = `${latitude.toFixed(2)}°N`;
        }

        cachedLocation = {
          latitude,
          longitude,
          city: city || null,
          region: region || null,
          country: 'Sri Lanka',
          formatted,
          isGps: true,
          isUnavailable: false,
        };

        AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(cachedLocation)).catch(() => {});
        return cachedLocation;
      }

      // GPS permission denied or GPS off — try IP Geolocation
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const ipRes = await fetch('https://ipwho.is/', { signal: controller.signal });
        clearTimeout(timer);
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData && ipData.success && ipData.latitude && ipData.longitude) {
            cachedLocation = {
              latitude: ipData.latitude,
              longitude: ipData.longitude,
              city: ipData.city || null,
              region: ipData.region || null,
              country: ipData.country || 'Sri Lanka',
              formatted: ipData.city ? `${ipData.city}, ${(ipData.country_code || 'LK')}` : 'IP Location',
              isGps: false,
              isUnavailable: false,
            };
            AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(cachedLocation)).catch(() => {});
            return cachedLocation;
          }
        }
      } catch (_) {}

      // All location methods failed — return unavailable (never lie)
      return UNAVAILABLE_LOCATION;
    } catch (err) {
      console.log('[LocationService] Error:', err.message);
      return cachedLocation || UNAVAILABLE_LOCATION;
    }
  },

  getCachedLocation: () => cachedLocation || UNAVAILABLE_LOCATION,

  getCoordinates: async () => {
    // If we have a real cached location (GPS or IP), return it and refresh in background
    if (cachedLocation && cachedLocation.latitude && cachedLocation.longitude && !cachedLocation.isUnavailable) {
      locationService.getCurrentLocation().catch(() => {});
      return {
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        city: cachedLocation.city,
        formatted: cachedLocation.formatted,
        isGps: !!cachedLocation.isGps,
        isUnavailable: false,
      };
    }

    // No real cache — actually fetch now
    const loc = await locationService.getCurrentLocation();
    if (loc && loc.latitude && loc.longitude && !loc.isUnavailable) {
      return {
        latitude: loc.latitude,
        longitude: loc.longitude,
        city: loc.city,
        formatted: loc.formatted,
        isGps: !!loc.isGps,
        isUnavailable: false,
      };
    }

    return UNAVAILABLE_LOCATION;
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
