import { AnalyticsData } from '@/libs/analytics'

interface ChartsProps {
  analyticsData: AnalyticsData
}

export default function Charts({ analyticsData }: ChartsProps) {
  return (
    <div className="space-y-6">
      {/* Status Breakdown */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Status Breakdown
          </h3>
          <div className="space-y-4">
            {analyticsData.statusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {item.status.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {item.count} submissions
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {analyticsData.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'APPROVED' ? 'bg-green-500' :
                    activity.status === 'REJECTED' ? 'bg-red-500' :
                    activity.status === 'IN_REVIEW' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {activity.status.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <p className="text-sm font-medium text-gray-900">
                      €{activity.amount.toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}