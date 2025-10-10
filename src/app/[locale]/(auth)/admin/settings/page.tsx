import { headers } from 'next/headers'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { unstable_setRequestLocale } from 'next-intl/server'

import { auth } from '@clerk/nextjs/server'
import { requireAnyRole } from '@/libs/rbac'

export default async function AdminSettingsPage(props: { params: { locale: string } }) {
  unstable_setRequestLocale(props.params.locale)
  const t = useTranslations('Admin.settings')
  
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
            href="/admin/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {t('back_to_dashboard')}
          </Link>
        </div>
      </div>

      {/* Organization Settings */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {t('organization_settings')}
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="organization-name" className="block text-sm font-medium text-gray-700">
                {t('organization_name')}
              </label>
              <input
                type="text"
                id="organization-name"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('organization_name_placeholder')}
              />
            </div>
            <div>
              <label htmlFor="organization-email" className="block text-sm font-medium text-gray-700">
                {t('contact_email')}
              </label>
              <input
                type="email"
                id="organization-email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('contact_email_placeholder')}
              />
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                {t('timezone')}
              </label>
              <select
                id="timezone"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option>UTC</option>
                <option>Europe/Paris</option>
                <option>America/New_York</option>
                <option>Asia/Tokyo</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              {t('save_settings')}
            </button>
          </div>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {t('system_preferences')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="email-notifications"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900">
                {t('email_notifications')}
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="auto-approval"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="auto-approval" className="ml-2 block text-sm text-gray-900">
                {t('auto_approval')}
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="ai-analysis"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="ai-analysis" className="ml-2 block text-sm text-gray-900">
                {t('ai_analysis')}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {t('storage_information')}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t('used_storage')}</span>
              <span>2.5 GB / 10 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
            <p className="text-sm text-gray-500">
              {t('storage_quota')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}