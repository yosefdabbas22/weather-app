import { useState } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
}

/**
 * Custom hook to get user's geolocation
 * @returns GeolocationState with coordinates, error, and loading state
 */
export function useGeolocation(): GeolocationState & { requestLocation: () => void } {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  })

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      })
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        })
      },
      (error) => {
        let errorMessage = 'Failed to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        setState({
          latitude: null,
          longitude: null,
          error: errorMessage,
          loading: false,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return { ...state, requestLocation }
}
