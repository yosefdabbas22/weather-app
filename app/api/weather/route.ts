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
    country_code?: string
    latitude: number
    longitude: number
    population?: number
    admin1?: string
    admin2?: string
    feature_code?: string
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
 * Validates if a geocoding result matches the expected city and country
 * @param result - Geocoding result to validate
 * @param expectedCity - Expected city name (normalized)
 * @param expectedCountry - Expected country name
 * @returns true if result is valid, false otherwise
 */
function validateGeocodingResult(
  result: NonNullable<GeocodingResult['results']>[number],
  expectedCity: string,
  expectedCountry: string
): boolean {
  // Check country match (case-insensitive)
  const resultCountry = result.country?.toLowerCase() || ''
  const expectedCountryLower = expectedCountry.toLowerCase()

  if (resultCountry !== expectedCountryLower) {
    return false
  }

  // Check if it's a major city (capital or high population)
  // Feature codes: PPLC = capital, PPLA = admin capital, PPL = city
  const isCapital = result.feature_code === 'PPLC' || result.feature_code === 'PPLA'
  const hasHighPopulation = result.population && result.population > 100000

  // For major cities, accept if it's a capital or has significant population
  if (isCapital || hasHighPopulation) {
    return true
  }

  // For smaller places, only accept if population is reasonable for a city
  if (result.population && result.population > 50000) {
    return true
  }

  // Reject villages, small towns, or admin areas without sufficient population
  return false
}

/**
 * Checks if search input refers to Amman city (not Oman country)
 * @param input - Search input
 * @returns true if input refers to Amman city
 */
function isAmmanCity(input: string): boolean {
  const normalized = normalizeCityName(input).toLowerCase().trim()

  // First check for explicit Oman country references - these should NOT match Amman
  const omanCountryPatterns = [
    'سلطنة عمان',
    'sultanate of oman',
    'sultanate oman',
    'country oman',
    'عُمان', // Oman with diacritic (different from عمان for Amman)
  ]

  for (const omanPattern of omanCountryPatterns) {
    if (normalized.includes(omanPattern.toLowerCase())) {
      return false // This is Oman country, not Amman city
    }
  }

  // Check for Amman city variants
  const ammanVariants = [
    'عمان', // Amman in Arabic (without diacritics)
    'amman',
    'ammān',
    'ammãn',
  ]

  // Exact match or contains Amman variant
  for (const variant of ammanVariants) {
    const variantLower = variant.toLowerCase()
    // Check if input is exactly the variant or contains it (but not as part of "Oman")
    if (
      normalized === variantLower ||
      (normalized.includes(variantLower) && !normalized.includes('oman') && !normalized.includes('عُمان'))
    ) {
      return true
    }
  }

  return false
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
  url.searchParams.set('count', '5') // Get more results to filter
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

/**
 * Filters and validates geocoding results for specific city requirements
 * @param results - Array of geocoding results
 * @param cityName - Original city name searched
 * @returns Best matching result or null
 */
function filterGeocodingResults(
  results: GeocodingResult['results'],
  cityName: string
): NonNullable<GeocodingResult['results']>[number] | null {
  if (!results || results.length === 0) {
    return null
  }

  // Special handling for Amman - must ALWAYS be in Jordan
  if (isAmmanCity(cityName)) {
    // Find Amman in Jordan specifically - reject any other country
    for (const result of results) {
      const resultCountry = result.country?.toLowerCase() || ''
      const resultCountryCode = result.country_code?.toLowerCase() || ''
      const resultName = result.name?.toLowerCase() || ''

      // CRITICAL: Must be in Jordan - reject any other country
      const isJordan =
        resultCountry === 'jordan' ||
        resultCountry === 'الأردن' ||
        resultCountryCode === 'jo' ||
        resultCountryCode === 'jor'

      if (!isJordan) {
        continue // Skip results from other countries
      }

      // Check if name matches Amman (case-insensitive)
      const nameMatchesAmman =
        resultName.includes('amman') ||
        resultName === 'عمان' ||
        resultName.includes('عمان') ||
        result.feature_code === 'PPLC' // Capital city code

      if (nameMatchesAmman) {
        // Validate it's a major city (capital or high population)
        const isCapital = result.feature_code === 'PPLC' || result.feature_code === 'PPLA'
        const hasHighPopulation = result.population && result.population > 100000

        if (isCapital || hasHighPopulation || (result.population && result.population > 50000)) {
          return result
        }
      }
    }

    // If no valid Amman in Jordan found, return null (don't accept false positives)
    // This ensures we never return Amman from another country
    return null
  }

  // For other cities, return the best matching result
  // Prefer results with higher population or capital status
  const sortedResults = [...results].sort((a, b) => {
    // Prioritize capitals
    if (a.feature_code === 'PPLC' && b.feature_code !== 'PPLC') return -1
    if (b.feature_code === 'PPLC' && a.feature_code !== 'PPLC') return 1

    // Then by population (higher is better)
    const popA = a.population || 0
    const popB = b.population || 0
    return popB - popA
  })

  // Return the best result, but validate it's a reasonable city (not a village)
  const bestResult = sortedResults[0]
  if (bestResult) {
    const isCapital = bestResult.feature_code === 'PPLC' || bestResult.feature_code === 'PPLA'
    const hasReasonablePopulation = bestResult.population && bestResult.population > 10000

    // Accept if it's a capital or has reasonable population
    if (isCapital || hasReasonablePopulation) {
      return bestResult
    }
  }

  return null
}

async function geocodeCity(city: string) {
  const trimmedCity = city.trim()
  if (!trimmedCity) {
    return null
  }

  // Parse input: remove country name and punctuation if present
  // Handles "عمان، الأردن" -> "عمان" or "Amman, Jordan" -> "Amman"
  const cityOnly = trimmedCity.split(/[،,]/)[0].trim()
  const searchCity = cityOnly || trimmedCity

  // Check if input contains Arabic characters
  const hasArabic = /[\u0600-\u06FF]/.test(searchCity)

  // Normalize Arabic input for better matching
  const normalizedInput = normalizeCityName(searchCity)

  let results: GeocodingResult['results'] | null = null

  // For Arabic input, try with language=ar first, then fallback to language=en
  if (hasArabic) {
    // Strategy 1: Try with parsed city name (without country) and language=ar
    results = await geocodeCityWithFallback(searchCity, 'ar')
    if (results && results.length > 0) {
      // Pass original input for Amman detection, but search uses parsed city
      const filtered = filterGeocodingResults(results, trimmedCity)
      if (filtered) {
        return filtered
      }
    }

    // Strategy 2: Try with normalized Arabic input and language=ar
    if (normalizedInput !== searchCity && normalizedInput !== searchCity.toLowerCase()) {
      results = await geocodeCityWithFallback(normalizedInput, 'ar')
      if (results && results.length > 0) {
        const filtered = filterGeocodingResults(results, searchCity)
        if (filtered) {
          return filtered
        }
      }
    }

    // Strategy 3: Fallback to language=en with parsed city name
    results = await geocodeCityWithFallback(searchCity, 'en')
    if (results && results.length > 0) {
      const filtered = filterGeocodingResults(results, searchCity)
      if (filtered) {
        return filtered
      }
    }

    // Strategy 4: Fallback to language=en with normalized input
    if (normalizedInput !== searchCity && normalizedInput !== searchCity.toLowerCase()) {
      results = await geocodeCityWithFallback(normalizedInput, 'en')
      if (results && results.length > 0) {
        const filtered = filterGeocodingResults(results, searchCity)
        if (filtered) {
          return filtered
        }
      }
    }

    // Strategy 5: Remove common Arabic words that might interfere
    const cleanedArabic = searchCity
      .replace(/^(في|من|إلى|على)\s+/g, '')
      .replace(/\s+(في|من|إلى|على)$/g, '')
      .trim()

    if (cleanedArabic && cleanedArabic !== searchCity) {
      results = await geocodeCityWithFallback(cleanedArabic, 'ar')
      if (results && results.length > 0) {
        const filtered = filterGeocodingResults(results, searchCity)
        if (filtered) {
          return filtered
        }
      }

      results = await geocodeCityWithFallback(cleanedArabic, 'en')
      if (results && results.length > 0) {
        const filtered = filterGeocodingResults(results, searchCity)
        if (filtered) {
          return filtered
        }
      }
    }
  } else {
    // For non-Arabic input, use English language with parsed city name
    results = await geocodeCityWithFallback(searchCity, 'en')
    if (results && results.length > 0) {
      const filtered = filterGeocodingResults(results, searchCity)
      if (filtered) {
        return filtered
      }
    }

    // Fallback: try with normalized input
    if (normalizedInput !== searchCity && normalizedInput !== searchCity.toLowerCase()) {
      results = await geocodeCityWithFallback(normalizedInput, 'en')
      if (results && results.length > 0) {
        const filtered = filterGeocodingResults(results, searchCity)
        if (filtered) {
          return filtered
        }
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

/**
 * Reverse geocodes coordinates to get city and country names
 * Always returns English names for consistency
 * Uses Nominatim (OpenStreetMap) with explicit English language setting
 */
async function reverseGeocode(latitude: number, longitude: number): Promise<{
  name: string
  country: string
} | null> {
  try {
    // Use Nominatim reverse geocoding with explicit language=en for English-only results
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'json')
    url.searchParams.set('lat', latitude.toString())
    url.searchParams.set('lon', longitude.toString())
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', '1')
    url.searchParams.set('accept-language', 'en') // Force English language

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'WeatherApp/1.0', // Required by Nominatim
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (!data || !data.address) {
      return null
    }

    // Extract city name and country from Nominatim response
    const address = data.address
    const cityName =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      address.state ||
      'Unknown'
    const country = address.country || 'Unknown'

    return {
      name: cityName,
      country: country,
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const latParam = searchParams.get('lat')
    const lonParam = searchParams.get('lon')
    const city = searchParams.get('city')

    let latitude: number
    let longitude: number
    let cityName: string
    let countryName: string
    let cacheKey: string

    // Priority: Use coordinates if provided (new flow)
    if (latParam && lonParam) {
      latitude = parseFloat(latParam)
      longitude = parseFloat(lonParam)

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: 'Invalid latitude or longitude' },
          { status: 400 }
        )
      }

      // Create cache key from coordinates
      cacheKey = `lat:${latitude.toFixed(4)},lon:${longitude.toFixed(4)}`

      // Check cache
      const cached = getCachedData(cacheKey)
      if (cached) {
        return NextResponse.json(cached)
      }

      // Reverse geocode to get city and country names
      const geocodeResult = await reverseGeocode(latitude, longitude)
      if (!geocodeResult) {
        // If reverse geocoding fails, use coordinates as fallback
        cityName = 'Unknown'
        countryName = 'Unknown'
      } else {
        cityName = geocodeResult.name
        countryName = geocodeResult.country
      }
    } else if (city) {
      // Fallback: Use city name (backward compatibility)
      if (!city.trim().length) {
        return NextResponse.json(
          { error: 'City parameter is required' },
          { status: 400 }
        )
      }

      cacheKey = normalizeCity(city)

      // Check cache
      const cached = getCachedData(cacheKey)
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

      latitude = geocodeResult.latitude
      longitude = geocodeResult.longitude
      cityName = geocodeResult.name
      countryName = geocodeResult.country
    } else {
      return NextResponse.json(
        { error: 'Either coordinates (lat, lon) or city parameter is required' },
        { status: 400 }
      )
    }

    // Get forecast using coordinates
    const forecast = await getForecast(latitude, longitude)

    if (!forecast.current || !forecast.daily) {
      return NextResponse.json(
        { error: 'Invalid forecast data received' },
        { status: 500 }
      )
    }

    // Shape response
    const weatherData = shapeWeatherResponse(
      { name: cityName, country: countryName },
      forecast
    )

    // Cache the result
    setCachedData(cacheKey, weatherData)

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data. Please try again later.' },
      { status: 500 }
    )
  }
}

