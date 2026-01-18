'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import StatCard from '@/components/StatCard'
import ForecastTable, { type ForecastDay } from '@/components/ForecastTable'
import { getWeatherInfo, getWeatherLabel, getWeatherIcon } from '@/lib/weatherCodes'

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

export default function Home() {
  const [searchValue, setSearchValue] = useState('')
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [state, setState] = useState<WeatherState>('empty')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const fetchWeather = async (city: string) => {
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
    } catch (error) {
      console.error('Weather fetch error:', error)
      setErrorMessage('Network error. Please check your connection and try again.')
      setState('error')
      setWeatherData(null)
    }
  }

  const handleSearchSubmit = () => {
    fetchWeather(searchValue)
  }

  // Helper to format temperature (will be extended in Step 6)
  const formatTemp = (temp: number) => `${temp}°F`

  // Helper to get summary text with weather condition
  const getSummaryText = (data: WeatherData) => {
    const high = data.daily[0]?.high || data.current.temperature
    // Use today's weather code (first day) or current weather code as fallback
    const weatherCode = data.daily[0]?.weatherCode || data.current.weatherCode
    const condition = getWeatherLabel(weatherCode).toLowerCase()
    return `${condition} with a high of ${formatTemp(high)}`
  }

  // Helper to get summary icon from weather code
  const getSummaryIcon = (data: WeatherData) => {
    // Use today's weather code (first day) or current weather code as fallback
    const weatherCode = data.daily[0]?.weatherCode || data.current.weatherCode
    return getWeatherIcon(weatherCode)
  }

  // Convert API data to ForecastDay format using weather code mapping
  const convertToForecastDays = (data: WeatherData): ForecastDay[] => {
    return data.daily.map((day) => {
      const weatherInfo = getWeatherInfo(day.weatherCode)
      return {
        day: day.date,
        high: formatTemp(day.high),
        low: formatTemp(day.low),
        condition: weatherInfo.label,
        icon: weatherInfo.icon,
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] flex flex-col">
      {/* Top Bar */}
      <header className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Weather App
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">°C</span>
            <div className="w-10 h-6 bg-gray-700 rounded-full relative">
              <div className="w-4 h-4 bg-gray-400 rounded-full absolute top-1 left-1"></div>
            </div>
            <span className="text-sm text-gray-400">°F</span>
          </div>
        </div>
      </header>

      {/* Main Content - Centered Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8" aria-label="Main weather content">
        <div className="w-full max-w-4xl mx-auto">
          {/* Search Bar */}
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            onSubmit={handleSearchSubmit}
          />

          {/* Loading State */}
          {state === 'loading' && (
            <div className="space-y-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-48 mb-2"></div>
                <div className="h-6 bg-gray-700 rounded w-64 mb-8"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
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
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-red-300 font-semibold mb-1">Error</h3>
                  <p className="text-red-200 text-sm">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State - Show initial placeholder or nothing */}
          {state === 'empty' && (
            <div className="text-center text-gray-500 py-12">
              <p>Search for a city to see weather information</p>
            </div>
          )}

          {/* Success State - Show weather data */}
          {state === 'success' && weatherData && (
            <>
              {/* City Title */}
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2" aria-label={`Weather for ${weatherData.city}, ${weatherData.country}`}>
                {weatherData.city}, {weatherData.country}
              </h2>

              {/* Summary Line */}
              <p className="text-gray-300 mb-8 flex items-center gap-2" aria-live="polite">
                <span aria-hidden="true">{getSummaryIcon(weatherData)}</span>
                <span>{getSummaryText(weatherData)}</span>
              </p>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard
                  label="Humidity"
                  value={weatherData.current.humidity}
                  unit="%"
                />
                <StatCard
                  label="Wind"
                  value={weatherData.current.windSpeed}
                  unit="mph"
                />
                <StatCard
                  label="Feels Like"
                  value={formatTemp(weatherData.current.feelsLike)}
                />
              </div>

              {/* 5-Day Forecast Table */}
              <ForecastTable forecast={convertToForecastDays(weatherData)} />
            </>
          )}

          {/* Footer */}
          {state !== 'empty' && (
            <footer className="text-center text-gray-500 text-sm mt-8">
              Weather data provided by Open-Meteo
            </footer>
          )}
        </div>
      </main>
    </div>
  )
}
