export default function Home() {
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
          <div className="mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for a city"
                className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

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
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Humidity</div>
              <div className="text-2xl font-semibold text-white">65%</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Wind</div>
              <div className="text-2xl font-semibold text-white">12 mph</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Feels Like</div>
              <div className="text-2xl font-semibold text-white">73°F</div>
            </div>
          </div>

          {/* 5-Day Forecast Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-8">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">5-Day Forecast</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {[1, 2, 3, 4, 5].map((day) => (
                <div
                  key={day}
                  className="p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {day === 1 ? 'Today' : `Day ${day}`}
                    </div>
                  </div>
                  <div className="flex-1 text-center text-gray-300">
                    <span className="text-white font-medium">75°</span>
                    <span className="mx-2 text-gray-500">/</span>
                    <span>58°</span>
                  </div>
                  <div className="flex-1 text-center text-gray-300">Clear</div>
                  <div className="flex-1 text-right">
                    <span className="text-2xl">☀️</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-gray-500 text-sm">
            Weather data provided by Open-Meteo
          </footer>
        </div>
      </main>
    </div>
  )
}

