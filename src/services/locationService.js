import * as Location from 'expo-location';
import AsyncStorage from '../utils/safeStorage';

const LOCATION_STORAGE_KEY = '@stockpot_last_location';

const DEFAULT_LOCATION = {
  latitude: 6.8436,
  longitude: 80.2604,
  city: 'Eheliyagoda',
  region: 'Sabaragamuwa',
  country: 'Sri Lanka',
  formatted: 'Eheliyagoda, LK',
  isGps: false,
};

let cachedLocation = { ...DEFAULT_LOCATION };

// Load persisted location on module initialization
(async () => {
  try {
    const saved = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.latitude && parsed.longitude) {
        cachedLocation = { ...DEFAULT_LOCATION, ...parsed };
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
  // Check whether location permissions are already granted
  hasPermission: async () => {
    try {
      const res = await Location.getForegroundPermissionsAsync();
      return res.status === 'granted';
    } catch (_) {
      return false;
    }
  },

  // Request location permission explicitly (used during Onboarding or Settings)
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

        // If no last known position, try active position with Low accuracy (fast lock)
        if (!coords) {
          try {
            const current = await withTimeout(
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
              3500,
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

        // If city still couldn't be resolved by name, check proximity to known Sri Lankan hubs
        if (!formatted) {
          // Check distance to Eheliyagoda center
          const dEheli = Math.hypot(latitude - 6.8436, longitude - 80.2604);
          const dColombo = Math.hypot(latitude - 6.9271, longitude - 79.8612);
          city = dEheli < 0.25 ? 'Eheliyagoda' : dColombo < 0.2 ? 'Colombo' : 'Sri Lanka';
          formatted = `${city}, LK`;
        }

        cachedLocation = {
          latitude,
          longitude,
          city: city || 'Eheliyagoda',
          region: region || 'LK',
          country: 'Sri Lanka',
          formatted: formatted || `${city || 'Eheliyagoda'}, LK`,
          isGps: true,
        };

        AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(cachedLocation)).catch(() => {});
        return cachedLocation;
      }

      // If GPS permission was denied or GPS was off, check IP Geolocation with 2.5s timeout
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const ipRes = await fetch('https://ipwho.is/', { signal: controller.signal });
        clearTimeout(timer);
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData && ipData.success && ipData.country_code === 'LK') {
            cachedLocation = {
              latitude: ipData.latitude || DEFAULT_LOCATION.latitude,
              longitude: ipData.longitude || DEFAULT_LOCATION.longitude,
              city: ipData.city || DEFAULT_LOCATION.city,
              region: ipData.region || DEFAULT_LOCATION.region,
              country: 'Sri Lanka',
              formatted: `${ipData.city || DEFAULT_LOCATION.city}, LK`,
              isGps: false,
            };
            AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(cachedLocation)).catch(() => {});
            return cachedLocation;
          }
        }
      } catch (_) {}

      // Return default location if all else fails (never returns null)
      return cachedLocation || DEFAULT_LOCATION;
    } catch (err) {
      console.log('[LocationService] Location detection note:', err.message);
      return cachedLocation || DEFAULT_LOCATION;
    }
  },

  getCachedLocation: () => cachedLocation || DEFAULT_LOCATION,

  getCoordinates: async () => {
    // If cached location already has valid coordinates and is less than 30 mins old, return immediately
    if (cachedLocation && cachedLocation.latitude && cachedLocation.longitude && cachedLocation.formatted) {
      // Trigger background refresh without blocking
      locationService.getCurrentLocation().catch(() => {});
      return {
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        city: cachedLocation.city || 'Eheliyagoda',
        formatted: cachedLocation.formatted || 'Eheliyagoda, LK',
        isGps: !!cachedLocation.isGps,
      };
    }

    const loc = await locationService.getCurrentLocation();
    if (loc && loc.latitude && loc.longitude) {
      return {
        latitude: loc.latitude,
        longitude: loc.longitude,
        city: loc.city || 'Eheliyagoda',
        formatted: loc.formatted || 'Eheliyagoda, LK',
        isGps: !!loc.isGps,
      };
    }

    return {
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
      city: DEFAULT_LOCATION.city,
      formatted: DEFAULT_LOCATION.formatted,
      isGps: false,
    };
  },

  // Allow user to manually pick or change city
  setManualLocation: async (cityName, lat = 6.8436, lng = 80.2604) => {
    cachedLocation = {
      latitude: lat,
      longitude: lng,
      city: cityName,
      region: 'LK',
      country: 'Sri Lanka',
      formatted: `${cityName}, LK`,
      isGps: false,
    };
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(cachedLocation)).catch(() => {});
    return cachedLocation;
  },
};

export default locationService;
