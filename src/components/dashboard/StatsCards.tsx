import { SubmissionStats } from '@/libs/analytics'

interface StatsCardsProps {
  stats: SubmissionStats
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Submissions',
      value: stats.total,
      description: 'All expense submissions',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: '📊'
    },
    {
      title: 'Approved',
      value: stats.approved,
      description: `€${stats.approvedAmount.toLocaleString()}`,
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: '✅'
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      description: 'Rejected submissions',
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: '❌'
    },
    {
      title: 'Pending Review',
      value: stats.pending,
      description: 'Awaiting approval',
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      icon: '⏳'
    },
    {
      title: 'Drafts',
      value: stats.draft,
      description: 'Incomplete submissions',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: '📝'
    },
    {
      title: 'Total Amount',
      value: `€${stats.totalAmount.toLocaleString()}`,
      description: 'Total justified amount',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: '💰'
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`relative overflow-hidden rounded-lg border p-6 ${card.color}`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 text-2xl">
              {card.icon}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium truncate">
                  {card.title}
                </dt>
                <dd className="text-2xl font-semibold">
                  {card.value}
                </dd>
                <dd className="text-sm opacity-75 mt-1">
                  {card.description}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}