interface RecentSearchesProps {
  searches: string[]
  onSelect: (city: string) => void
  onClear: () => void
}

export default function RecentSearches({
  searches,
  onSelect,
  onClear,
}: RecentSearchesProps) {
  if (searches.length === 0) {
    return null
  }

  return (
    <div className="mb-4" role="region" aria-label="Recent searches">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-400">Recent Searches</h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          aria-label="Clear recent searches"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((city, index) => (
          <button
            key={`${city}-${index}`}
            type="button"
            onClick={() => onSelect(city)}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Search for ${city}`}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  )
}
