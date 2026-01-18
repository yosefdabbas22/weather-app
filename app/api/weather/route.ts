import { NextRequest, NextResponse } from 'next/server'

// In-memory cache with TTL (10 minutes = 600000 ms)
interface CacheEntry {
  data: WeatherResponse
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// Response types
interface WeatherResponse {
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

// Open-Meteo API types
interface GeocodingResult {
  results?: Array<{
    name: string
    country: string
    latitude: number
    longitude: number
  }>
}

interface ForecastResponse {
  current?: {
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    weather_code: number
    wind_speed_10m: number
  }
  daily?: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
  }
}

function normalizeCity(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, ' ')
}

function getCacheKey(city: string): string {
  return normalizeCity(city)
}

function getCachedData(city: string): WeatherResponse | null {
  const key = getCacheKey(city)
  const entry = cache.get(key)

  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return entry.data
}

function setCachedData(city: string, data: WeatherResponse): void {
  const key = getCacheKey(city)
  cache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

async function geocodeCity(city: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache geocoding for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data: GeocodingResult = await response.json()

    if (!data.results || data.results.length === 0) {
      return null
    }

    return data.results[0]
  } catch (error) {
    console.error('Geocoding error:', error)
    throw new Error('Failed to geocode city')
  }
}

async function getForecast(latitude: number, longitude: number) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', latitude.toString())
  url.searchParams.set('longitude', longitude.toString())
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m')
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weather_code')
  url.searchParams.set('timezone', 'auto')

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 600 }, // Cache forecast for 10 minutes
    })

    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status}`)
    }

    const data: ForecastResponse = await response.json()
    return data
  } catch (error) {
    console.error('Forecast error:', error)
    throw new Error('Failed to fetch forecast')
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

function shapeWeatherResponse(
  geocode: { name: string; country: string },
  forecast: ForecastResponse
): WeatherResponse {
  const current = forecast.current!
  const daily = forecast.daily!

  // Get first 5 days of forecast
  const dailyForecast = daily.time.slice(0, 5).map((date, index) => ({
    date: formatDate(date),
    high: Math.round(daily.temperature_2m_max[index]),
    low: Math.round(daily.temperature_2m_min[index]),
    weatherCode: daily.weather_code[index],
  }))

  return {
    city: geocode.name,
    country: geocode.country,
    current: {
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      feelsLike: Math.round(current.apparent_temperature),
      windSpeed: Math.round(current.wind_speed_10m),
      weatherCode: current.weather_code,
    },
    daily: dailyForecast,
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')

    // Validate city parameter
    if (!city || city.trim().length === 0) {
      return NextResponse.json(
        { error: 'City parameter is required' },
        { status: 400 }
      )
    }

    // Check cache
    const cached = getCachedData(city)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Geocode city
    const geocodeResult = await geocodeCity(city)
    if (!geocodeResult) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      )
    }

    // Get forecast
    const forecast = await getForecast(
      geocodeResult.latitude,
      geocodeResult.longitude
    )

    if (!forecast.current || !forecast.daily) {
      return NextResponse.json(
        { error: 'Invalid forecast data received' },
        { status: 500 }
      )
    }

    // Shape response
    const weatherData = shapeWeatherResponse(geocodeResult, forecast)

    // Cache the result
    setCachedData(city, weatherData)

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data. Please try again later.' },
      { status: 500 }
    )
  }
}

