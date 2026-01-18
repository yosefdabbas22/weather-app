'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import StatCard from '@/components/StatCard'
import ForecastTable, { type ForecastDay } from '@/components/ForecastTable'

// Mock data - will be replaced with API data later
const mockForecast: ForecastDay[] = [
  { day: 'Today', high: '75°', low: '58°', condition: 'Clear', icon: '☀️' },
  { day: 'Tomorrow', high: '72°', low: '56°', condition: 'Partly Cloudy', icon: '⛅' },
  { day: 'Wednesday', high: '68°', low: '54°', condition: 'Cloudy', icon: '☁️' },
  { day: 'Thursday', high: '70°', low: '55°', condition: 'Clear', icon: '☀️' },
  { day: 'Friday', high: '73°', low: '57°', condition: 'Partly Cloudy', icon: '⛅' },
]

export default function Home() {
  const [searchValue, setSearchValue] = useState('')

  const handleSearchSubmit = () => {
    // Will be implemented in Step 4
    console.log('Searching for:', searchValue)
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
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-4xl mx-auto">
          {/* Search Bar */}
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            onSubmit={handleSearchSubmit}
          />

          {/* City Title */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Amman, Jordan
          </h2>

          {/* Summary Line */}
          <p className="text-gray-300 mb-8 flex items-center gap-2">
            <span>☀️</span>
            <span>Mostly clear with a high of 75°F</span>
          </p>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Humidity" value={65} unit="%" />
            <StatCard label="Wind" value={12} unit="mph" />
            <StatCard label="Feels Like" value="73°" />
          </div>

          {/* 5-Day Forecast Table */}
          <ForecastTable forecast={mockForecast} />

          {/* Footer */}
          <footer className="text-center text-gray-500 text-sm">
            Weather data provided by Open-Meteo
          </footer>
        </div>
      </main>
    </div>
  )
}
