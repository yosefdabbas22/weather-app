'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import SearchBar from '@/components/SearchBar'
import StatCard from '@/components/StatCard'
import ForecastTable, { type ForecastDay } from '@/components/ForecastTable'
import RecentSearches from '@/components/RecentSearches'
import { getWeatherInfo, getWeatherLabel, getWeatherIcon } from '@/lib/weatherCodes'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import { useGeolocation } from '@/lib/hooks/useGeolocation'

// Weather API response type
interface WeatherData {
  city: string
  country: string
  current: {
    temperature: number
    humidity: number
    feelsLike: number
    windSpeed: number
    weatherCode: number
  }
  daily: Array<{
    date: string
    high: number
    low: number
    weatherCode: number
  }>
}

type WeatherState = 'empty' | 'loading' | 'error' | 'success'

const MAX_RECENT_SEARCHES = 5

export default function Home() {
  const [searchValue, setSearchValue] = useState('')
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [state, setState] = useState<WeatherState>('empty')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [unit, setUnit] = useState<'c' | 'f'>('c')
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(
    'weather-recent-searches',
    []
  )
  const [isMounted, setIsMounted] = useState(false)

  // Track last fetched coordinates to prevent duplicate fetches
  const lastFetchedCoords = useRef<{ lat: number; lon: number } | null>(null)

  // Fix hydration error by only rendering client-side components after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Debounce search value to prevent excessive API calls
  const debouncedSearchValue = useDebounce(searchValue, 500)

  // Geolocation hook
  const { latitude, longitude, error: geoError, loading: geoLoading, requestLocation } =
    useGeolocation()

  // Fetch weather by city name
  const fetchWeatherByCity = useCallback(
    async (city: string) => {
      if (!city.trim()) {
        return
      }

      setState('loading')
      setErrorMessage('')

      try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city.trim())}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          setErrorMessage(errorData.error || 'Failed to fetch weather data')
          setState('error')
          setWeatherData(null)
          return
        }

        const data: WeatherData = await response.json()
        setWeatherData(data)
        setState('success')

        // Add to recent searches
        const normalizedCity = city.trim()
        setRecentSearches((prev) => {
          const filtered = prev.filter((item) => item.toLowerCase() !== normalizedCity.toLowerCase())
          return [normalizedCity, ...filtered].slice(0, MAX_RECENT_SEARCHES)
        })
      } catch (error) {
        console.error('Weather fetch error:', error)
        setErrorMessage('Network error. Please check your connection and try again.')
        setState('error')
        setWeatherData(null)
      }
    },
    [setRecentSearches]
  )

  // Fetch weather by coordinates
  const fetchWeatherByLocation = useCallback(async (lat: number, lon: number) => {
    // Prevent duplicate fetches for the same coordinates
    if (
      lastFetchedCoords.current?.lat === lat &&
      lastFetchedCoords.current?.lon === lon
    ) {
      return
    }

    // Track these coordinates as being fetched
    lastFetchedCoords.current = { lat, lon }

    setState('loading')
    setErrorMessage('')

    try {
      const response = await fetch(`/api/weather/location?lat=${lat}&lon=${lon}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setErrorMessage(errorData.error || 'Failed to fetch weather data')
        setState('error')
        setWeatherData(null)
        lastFetchedCoords.current = null // Reset on error to allow retry
        return
      }

      const data: WeatherData = await response.json()
      setWeatherData(data)
      setState('success')

      // Add to recent searches
      const cityName = `${data.city}, ${data.country}`
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== cityName.toLowerCase())
        return [cityName, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      })
    } catch (error) {
      console.error('Weather fetch error:', error)
      setErrorMessage('Network error. Please check your connection and try again.')
      setState('error')
      setWeatherData(null)
      lastFetchedCoords.current = null // Reset on error to allow retry
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // setRecentSearches is stable, no need to include it

  // Handle geolocation success - only fetch once when coordinates are available
  useEffect(() => {
    if (
      latitude !== null &&
      longitude !== null &&
      (lastFetchedCoords.current?.lat !== latitude || lastFetchedCoords.current?.lon !== longitude)
    ) {
      fetchWeatherByLocation(latitude, longitude)
    }
    // fetchWeatherByLocation is stable (empty deps), safe to include
  }, [latitude, longitude, fetchWeatherByLocation])

  // Handle debounced search (only for manual typing, not on submit)
  useEffect(() => {
    // Only auto-search if user is typing (not on initial mount or after submit)
    // This prevents auto-searching on every debounce
    // We'll rely on Enter key or button click for manual searches
  }, [debouncedSearchValue])

  const handleSearchSubmit = () => {
    if (searchValue.trim()) {
      fetchWeatherByCity(searchValue)
    }
  }

  const handleRecentSearchSelect = (city: string) => {
    setSearchValue(city)
    fetchWeatherByCity(city)
  }

  const handleClearRecentSearches = () => {
    setRecentSearches([])
  }

  const handleUseLocation = () => {
    requestLocation()
  }

  // Convert Celsius to Fahrenheit
  const cToF = (c: number): number => {
    return Math.round((c * 9) / 5 + 32)
  }

  // Format temperature with correct unit (assumes input is in Celsius)
  const formatTemp = (tempC: number, unit: 'c' | 'f'): string => {
    const value = unit === 'f' ? cToF(tempC) : Math.round(tempC)
    const symbol = unit === 'f' ? '°F' : '°C'
    return `${value}${symbol}`
  }

  // Helper to get summary text with weather condition
  const getSummaryText = (data: WeatherData) => {
    const high = data.daily[0]?.high || data.current.temperature
    const weatherCode = data.daily[0]?.weatherCode || data.current.weatherCode
    const condition = getWeatherLabel(weatherCode).toLowerCase()
    return `${condition} with a high of ${formatTemp(high, unit)}`
  }

  // Helper to get summary icon from weather code
  const getSummaryIcon = (data: WeatherData) => {
    const weatherCode = data.daily[0]?.weatherCode || data.current.weatherCode
    return getWeatherIcon(weatherCode)
  }

  // Convert API data to ForecastDay format using weather code mapping
  const convertToForecastDays = useMemo(
    () => (data: WeatherData): ForecastDay[] => {
      return data.daily.map((day) => {
        const weatherInfo = getWeatherInfo(day.weatherCode)
        return {
          day: day.date,
          high: formatTemp(day.high, unit),
          low: formatTemp(day.low, unit),
          condition: weatherInfo.label,
          icon: weatherInfo.icon,
        }
      })
    },
    [unit]
  )

  const forecastDays = weatherData ? convertToForecastDays(weatherData) : []

  return (
    <div className="min-h-screen bg-[#0b0f14] flex flex-col">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Top Bar */}
      <header className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">Weather App</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400" aria-hidden="true">
              °C
            </span>
            <button
              type="button"
              onClick={() => setUnit(unit === 'c' ? 'f' : 'c')}
              aria-label={`Switch to ${unit === 'c' ? 'Fahrenheit' : 'Celsius'}`}
              className="w-10 h-6 bg-gray-700 rounded-full relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0b0f14] transition-colors"
              role="switch"
              aria-checked={unit === 'f'}
            >
              <div
                className={`w-4 h-4 bg-gray-400 rounded-full absolute top-1 transition-transform duration-200 ${unit === 'f' ? 'left-5' : 'left-1'
                  }`}
                aria-hidden="true"
              ></div>
            </button>
            <span className="text-sm text-gray-400" aria-hidden="true">
              °F
            </span>
          </div>
        </div>
      </header>

      {/* Main Content - Centered Container */}
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8"
        aria-label="Main weather content"
      >
        <div className="w-full max-w-4xl mx-auto">
          {/* Search Bar */}
          <div className="mb-4">
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              onSubmit={handleSearchSubmit}
            />
            {/* Location Button - Centered */}
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={geoLoading}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-gray-300 rounded-lg border border-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0b0f14] flex items-center gap-2"
                aria-label="Use my current location"
              >
                {geoLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Getting location...</span>
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    <span>Use my location</span>
                  </>
                )}
              </button>
            </div>
            {geoError && (
              <p
                className="text-sm text-red-400 text-center mt-2"
                role="alert"
                aria-live="polite"
              >
                {geoError}
              </p>
            )}
          </div>

          {/* Recent Searches - Only render on client to avoid hydration error */}
          {isMounted && (
            <RecentSearches
              searches={recentSearches}
              onSelect={handleRecentSearchSelect}
              onClear={handleClearRecentSearches}
            />
          )}

          {/* Loading State */}
          {state === 'loading' && (
            <div className="space-y-8 animate-fade-in">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-48 mb-2"></div>
                <div className="h-6 bg-gray-700 rounded w-64 mb-8"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                      aria-hidden="true"
                    >
                      <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
                      <div className="h-8 bg-gray-700 rounded w-16"></div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <div className="h-6 bg-gray-700 rounded w-40 mb-4"></div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-gray-700 rounded mb-2"></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div
              className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-8 animate-fade-in"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  ⚠️
                </span>
                <div>
                  <h3 className="text-red-300 font-semibold mb-1">Error</h3>
                  <p className="text-red-200 text-sm">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {state === 'empty' && (
            <div className="text-center text-gray-500 py-12 animate-fade-in">
              <p>Search for a city to see weather information</p>
            </div>
          )}

          {/* Success State - Show weather data */}
          {state === 'success' && weatherData && (
            <div className="animate-fade-in">
              {/* City Title */}
              <h2
                className="text-3xl sm:text-4xl font-bold text-white mb-2"
                aria-label={`Weather for ${weatherData.city}, ${weatherData.country}`}
              >
                {weatherData.city}, {weatherData.country}
              </h2>

              {/* Summary Line */}
              <p className="text-gray-300 mb-8 flex items-center gap-2" aria-live="polite">
                <span aria-hidden="true">{getSummaryIcon(weatherData)}</span>
                <span>{getSummaryText(weatherData)}</span>
              </p>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard label="Humidity" value={weatherData.current.humidity} unit="%" />
                <StatCard label="Wind" value={weatherData.current.windSpeed} unit="mph" />
                <StatCard
                  label="Feels Like"
                  value={formatTemp(weatherData.current.feelsLike, unit)}
                />
              </div>

              {/* 5-Day Forecast Table */}
              <ForecastTable forecast={forecastDays} />
            </div>
          )}

          {/* Footer */}
          {state !== 'empty' && (
            <footer className="text-center text-gray-500 text-sm mt-8" role="contentinfo">
              Weather data provided by Open-Meteo
            </footer>
          )}
        </div>
      </main>
    </div>
  )
}
