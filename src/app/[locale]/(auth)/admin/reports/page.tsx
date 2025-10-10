import { headers } from 'next/headers'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { unstable_setRequestLocale } from 'next-intl/server'

import { auth } from '@clerk/nextjs/server'
import { requireAnyRole } from '@/libs/rbac'
import { getAnalyticsData } from '@/libs/analytics'
import StatsCards from '@/components/dashboard/StatsCards'
import Charts from '@/components/dashboard/Charts'

export default async function AdminReportsPage(props: { params: { locale: string } }) {
  unstable_setRequestLocale(props.params.locale)
  const t = useTranslations('Admin.reports')
  
  const headersList = await headers()
  const organizationId = headersList.get('x-organization-id')
  await auth()

  // Check if user has admin privileges
  try {
    await requireAnyRole(['admin', 'superadmin'])
  } catch {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">{t('access_denied')}</h1>
        <p className="mt-2 text-gray-600">{t('access_denied_description')}</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          {t('back_to_dashboard')}
        </Link>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">{t('organization_not_found')}</h1>
        <p className="mt-2 text-gray-600">{t('organization_not_found_description')}</p>
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
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            href="/admin/reports/export"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            {t('export_data')}
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {t('back_to_dashboard')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={analyticsData.stats} />

      {/* Charts and Analytics */}
      <Charts analyticsData={analyticsData} />

      {/* Quick Actions */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {t('quick_actions')}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/submissions"
              className="inline-flex items-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('view_all_submissions')}
            </Link>
            <Link
              href="/submissions/new"
              className="inline-flex items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              {t('create_new_submission')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}