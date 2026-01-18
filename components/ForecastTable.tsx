import ForecastRow from './ForecastRow'

export interface ForecastDay {
  day: string
  high: number | string
  low: number | string
  condition: string
  icon: string
}

interface ForecastTableProps {
  forecast: ForecastDay[]
}

export default function ForecastTable({ forecast }: ForecastTableProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-8">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">5-Day Forecast</h3>
      </div>
      <div className="divide-y divide-gray-700">
        {forecast.map((day, index) => (
          <ForecastRow key={index} {...day} />
        ))}
      </div>
    </div>
  )
}

