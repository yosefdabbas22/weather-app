import { NextRequest, NextResponse } from 'next/server'
import { normalizeCityName } from '@/lib/arabicNormalize'

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
  // Use Arabic-aware normalization that handles both Arabic and English input
  return normalizeCityName(city)
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

/**
 * Attempts to geocode a city name using Open-Meteo Geocoding API
 * @param searchQuery - City name to search for
 * @param language - Language code (ar, en, etc.) - affects response language, not search
 * @returns Geocoding results or null if not found
 */
async function geocodeCityWithFallback(
  searchQuery: string,
  language?: string
): Promise<GeocodingResult['results'] | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', searchQuery)
  url.searchParams.set('count', '1')
  if (language) {
    url.searchParams.set('language', language)
  }

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // Cache geocoding for 1 hour
    })

    if (!response.ok) {
      return null
    }

    const data: GeocodingResult = await response.json()

    if (data.results && data.results.length > 0) {
      return data.results
    }

    return null
  } catch (error) {
    console.error(`Geocoding error for "${searchQuery}" (${language || 'default'}):`, error)
    return null
  }
}

async function geocodeCity(city: string) {
  const trimmedCity = city.trim()
  if (!trimmedCity) {
    return null
  }

  // Check if input contains Arabic characters
  const hasArabic = /[\u0600-\u06FF]/.test(trimmedCity)

  // Normalize Arabic input for better matching
  const normalizedInput = normalizeCityName(trimmedCity)

  let results: GeocodingResult['results'] | null = null

  // For Arabic input, try with language=ar first, then fallback to language=en
  if (hasArabic) {
    // Strategy 1: Try with original Arabic input and language=ar
    results = await geocodeCityWithFallback(trimmedCity, 'ar')
    if (results && results.length > 0) {
      return results[0] // Accept result even if API returns English name
    }

    // Strategy 2: Try with normalized Arabic input and language=ar
    if (normalizedInput !== trimmedCity && normalizedInput !== trimmedCity.toLowerCase()) {
      results = await geocodeCityWithFallback(normalizedInput, 'ar')
      if (results && results.length > 0) {
        return results[0]
      }
    }

    // Strategy 3: Fallback to language=en with original input
    results = await geocodeCityWithFallback(trimmedCity, 'en')
    if (results && results.length > 0) {
      return results[0]
    }

    // Strategy 4: Fallback to language=en with normalized input
    if (normalizedInput !== trimmedCity && normalizedInput !== trimmedCity.toLowerCase()) {
      results = await geocodeCityWithFallback(normalizedInput, 'en')
      if (results && results.length > 0) {
        return results[0]
      }
    }

    // Strategy 5: Remove country name if present (e.g., "عمان، الأردن" -> "عمان")
    const cityOnly = trimmedCity.split(/[،,]/)[0].trim()
    if (cityOnly && cityOnly !== trimmedCity) {
      // Try with Arabic language
      results = await geocodeCityWithFallback(cityOnly, 'ar')
      if (results && results.length > 0) {
        return results[0]
      }

      // Try with English language
      results = await geocodeCityWithFallback(cityOnly, 'en')
      if (results && results.length > 0) {
        return results[0]
      }

      // Try normalized version of city only
      const normalizedCityOnly = normalizeCityName(cityOnly)
      if (normalizedCityOnly !== cityOnly && normalizedCityOnly !== cityOnly.toLowerCase()) {
        results = await geocodeCityWithFallback(normalizedCityOnly, 'ar')
        if (results && results.length > 0) {
          return results[0]
        }

        results = await geocodeCityWithFallback(normalizedCityOnly, 'en')
        if (results && results.length > 0) {
          return results[0]
        }
      }
    }

    // Strategy 6: Remove common Arabic words that might interfere
    const cleanedArabic = trimmedCity
      .replace(/^(في|من|إلى|على)\s+/g, '')
      .replace(/\s+(في|من|إلى|على)$/g, '')
      .trim()

    if (cleanedArabic && cleanedArabic !== trimmedCity) {
      results = await geocodeCityWithFallback(cleanedArabic, 'ar')
      if (results && results.length > 0) {
        return results[0]
      }

      results = await geocodeCityWithFallback(cleanedArabic, 'en')
      if (results && results.length > 0) {
        return results[0]
      }
    }
  } else {
    // For non-Arabic input, use English language
    results = await geocodeCityWithFallback(trimmedCity, 'en')
    if (results && results.length > 0) {
      return results[0]
    }

    // Fallback: try with normalized input
    if (normalizedInput !== trimmedCity && normalizedInput !== trimmedCity.toLowerCase()) {
      results = await geocodeCityWithFallback(normalizedInput, 'en')
      if (results && results.length > 0) {
        return results[0]
      }
    }

    // Remove country name if present
    const cityOnly = trimmedCity.split(/[،,]/)[0].trim()
    if (cityOnly && cityOnly !== trimmedCity) {
      results = await geocodeCityWithFallback(cityOnly, 'en')
      if (results && results.length > 0) {
        return results[0]
      }
    }
  }

  // All strategies failed
  return null
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

