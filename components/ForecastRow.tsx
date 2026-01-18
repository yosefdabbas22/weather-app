interface ForecastRowProps {
  day: string
  high: number | string
  low: number | string
  condition: string
  icon: string
}

export default function ForecastRow({
  day,
  high,
  low,
  condition,
  icon,
}: ForecastRowProps) {
  return (
    <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 hover:bg-gray-750 transition-colors" role="row">
      <div className="flex-1 min-w-[80px]">
        <div className="text-white font-medium">{day}</div>
      </div>
      <div className="flex-1 text-center sm:text-left text-gray-300">
        <span className="text-white font-medium">{high}</span>
        <span className="mx-2 text-gray-500" aria-hidden="true">/</span>
        <span>{low}</span>
      </div>
      <div className="flex-1 text-center sm:text-left text-gray-300">{condition}</div>
      <div className="flex-1 text-right">
        <span className="text-2xl" aria-label={`${condition} weather icon`} role="img">
          {icon}
        </span>
      </div>
    </div>
  )
}

