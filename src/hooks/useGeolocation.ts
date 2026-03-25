import { useState, useEffect } from 'react';

interface GeolocationResult {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(enabled: boolean): GeolocationResult {
  const [location, setLocation] = useState<GeolocationResult>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    if (!enabled) return;
    if (!navigator.geolocation) {
      setLocation((prev) => ({ ...prev, error: "Geolocation is not supported by your browser" }));
      return;
    }

    setLocation((prev) => ({ ...prev, loading: true }));

    const geoId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        setLocation({
          latitude: null,
          longitude: null,
          error: error.message,
          loading: false,
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(geoId);
    };
  }, [enabled]);

  return location;
}
