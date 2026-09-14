import * as Location from 'expo-location';

let cachedLocation = {
  city: 'Colombo 07',
  region: 'Western Province',
  country: 'Sri Lanka',
  formatted: 'Colombo 07, LK',
  latitude: 6.9044,
  longitude: 79.8668,
  isGps: true,
};

export const locationService = {
  getCurrentLocation: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;
        const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (geocode) {
          const city = geocode.district || geocode.city || geocode.subregion || 'Colombo';
          const region = geocode.region || 'Western Province';
          cachedLocation = {
            city,
            region,
            country: geocode.country || 'Sri Lanka',
            formatted: `${city}, ${geocode.isoCountryCode || 'LK'}`,
            latitude,
            longitude,
            isGps: true,
          };
        } else {
          cachedLocation = {
            ...cachedLocation,
            latitude,
            longitude,
          };
        }
      }
    } catch (err) {
      console.log('[LocationService] GPS detection info:', err.message);
    }
    return cachedLocation;
  },

  getCachedLocation: () => cachedLocation,
};

export default locationService;
