import { headers } from 'next/headers'
import Link from 'next/link'

import { auth } from '@clerk/nextjs/server'
import { requireAnyRole } from '@/libs/rbac'
import { getAnalyticsData } from '@/libs/analytics'
import StatsCards from '@/components/dashboard/StatsCards'
import Charts from '@/components/dashboard/Charts'

export default async function AdminDashboardPage() {
  const headersList = await headers()
  const organizationId = headersList.get('x-organization-id')
  await auth()

  // Check if user has admin privileges
  try {
    await requireAnyRole(['admin', 'superadmin'])
  } catch {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-gray-600">You need admin privileges to access this page.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to Dashboard
        </Link>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Organization Not Found</h1>
        <p className="mt-2 text-gray-600">Please check the URL and try again.</p>
      </div>
    )
  }

  // Get analytics data
  const analyticsData = await getAnalyticsData(organizationId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of your organization's expense submissions and statistics
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            href="/admin/reports"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View Reports
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={analyticsData.stats} />

      {/* Charts and Analytics */}
      <Charts analyticsData={analyticsData} />

      {/* Quick Actions */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/submissions"
              className="inline-flex items-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View All Submissions
            </Link>
            <Link
              href="/submissions/new"
              className="inline-flex items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create New Submission
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}