interface StatCardProps {
  label: string
  value: string | number
  unit?: string
}

export default function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-white">
        {value}
        {unit && <span className="ml-1 text-lg">{unit}</span>}
      </div>
    </div>
  )
}

