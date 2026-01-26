import { NextRequest, NextResponse } from 'next/server'

// Reuse types and functions from the main weather route
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

/**
 * Reverse geocodes coordinates to get city and country names
 * Always returns English names for consistency
 * Uses Nominatim (OpenStreetMap) with explicit English language setting
 */
async function reverseGeocode(latitude: number, longitude: number) {
  // Always use Nominatim with explicit language=en for consistent English-only results
  // This ensures location names are always in English, matching the search behavior
  return reverseGeocodeNominatim(latitude, longitude)
}

// Fallback function using Nominatim (OpenStreetMap) - free, no API key required
// Explicitly set language=en to ensure English-only location names
async function reverseGeocodeNominatim(latitude: number, longitude: number) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'json')
  url.searchParams.set('lat', latitude.toString())
  url.searchParams.set('lon', longitude.toString())
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '1')
  url.searchParams.set('accept-language', 'en') // Force English language

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'WeatherApp/1.0', // Required by Nominatim
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`Nominatim reverse geocoding error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data || !data.address) {
      return { name: 'Unknown', country: 'Unknown' }
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
    console.error('Nominatim reverse geocoding error:', error)
    return { name: 'Unknown', country: 'Unknown' }
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
      next: { revalidate: 600 },
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
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude parameters are required' },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude' },
        { status: 400 }
      )
    }

    // Reverse geocode to get city name
    const geocodeResult = await reverseGeocode(latitude, longitude)

    // Get forecast
    const forecast = await getForecast(latitude, longitude)

    if (!forecast.current || !forecast.daily) {
      return NextResponse.json(
        { error: 'Invalid forecast data received' },
        { status: 500 }
      )
    }

    // Shape response
    const weatherData = shapeWeatherResponse(geocodeResult, forecast)

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data. Please try again later.' },
      { status: 500 }
    )
  }
}
