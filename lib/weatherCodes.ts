// Open-Meteo uses WMO Weather Interpretation Codes
// Maps weather code to label and emoji icon

interface WeatherInfo {
  label: string
  icon: string
}

const weatherCodeMap: Record<number, WeatherInfo> = {
  // Clear and cloud variations
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },

  // Fog
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Depositing rime fog', icon: '🌫️' },

  // Drizzle
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Moderate drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌦️' },
  56: { label: 'Light freezing drizzle', icon: '🌨️' },
  57: { label: 'Dense freezing drizzle', icon: '🌨️' },

  // Rain
  61: { label: 'Slight rain', icon: '🌧️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Light freezing rain', icon: '🌨️' },
  67: { label: 'Heavy freezing rain', icon: '🌨️' },

  // Snow
  71: { label: 'Slight snow', icon: '❄️' },
  73: { label: 'Moderate snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },

  // Rain showers
  80: { label: 'Slight rain showers', icon: '🌦️' },
  81: { label: 'Moderate rain showers', icon: '🌧️' },
  82: { label: 'Violent rain showers', icon: '🌧️' },

  // Snow showers
  85: { label: 'Slight snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '🌨️' },

  // Thunderstorm
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { label: 'Thunderstorm with heavy hail', icon: '⛈️' },
}

/**
 * Get weather information from WMO weather code
 * @param code - WMO weather interpretation code
 * @returns WeatherInfo with label and icon, or default clear sky if code not found
 */
export function getWeatherInfo(code: number): WeatherInfo {
  return weatherCodeMap[code] || { label: 'Unknown', icon: '☀️' }
}

/**
 * Get weather label from code
 */
export function getWeatherLabel(code: number): string {
  return getWeatherInfo(code).label
}

/**
 * Get weather icon emoji from code
 */
export function getWeatherIcon(code: number): string {
  return getWeatherInfo(code).icon
}

