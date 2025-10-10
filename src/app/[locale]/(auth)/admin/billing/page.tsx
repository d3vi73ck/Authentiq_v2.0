import { headers } from 'next/headers'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { unstable_setRequestLocale } from 'next-intl/server'

import { auth } from '@clerk/nextjs/server'
import { requireAnyRole } from '@/libs/rbac'

export default async function AdminBillingPage(props: { params: { locale: string } }) {
  unstable_setRequestLocale(props.params.locale)
  const t = useTranslations('Admin.billing')
  
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

      {/* Current Plan */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {t('current_plan')}
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{t('pro_plan')}</h4>
                <p className="text-gray-600">{t('pro_plan_price')}</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {t('active')}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">10</div>
                <div className="text-sm text-gray-600">{t('team_members')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">5</div>
                <div className="text-sm text-gray-600">{t('organizations')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">50 GB</div>
                <div className="text-sm text-gray-600">{t('storage')}</div>
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('manage_subscription')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Information */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {t('billing_information')}
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t('next_billing_date')}</span>
              <span className="text-sm font-medium text-gray-900">December 1, 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t('payment_method')}</span>
              <span className="text-sm font-medium text-gray-900">Visa ending in 4242</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t('billing_email')}</span>
              <span className="text-sm font-medium text-gray-900">admin@example.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {t('payment_history')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">November 1, 2024</p>
                <p className="text-sm text-gray-600">Pro Plan - Monthly</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">$49.00</p>
                <p className="text-sm text-green-600">{t('paid')}</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">October 1, 2024</p>
                <p className="text-sm text-gray-600">Pro Plan - Monthly</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">$49.00</p>
                <p className="text-sm text-green-600">{t('paid')}</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">September 1, 2024</p>
                <p className="text-sm text-gray-600">Pro Plan - Monthly</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">$49.00</p>
                <p className="text-sm text-green-600">{t('paid')}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('view_full_history')}
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {t('upgrade_options')}
          </h3>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{t('enterprise_plan')}</h4>
                  <p className="text-gray-600">{t('enterprise_plan_price')}</p>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>• {t('unlimited_team_members')}</li>
                    <li>• {t('unlimited_organizations')}</li>
                    <li>• 500 GB {t('storage')}</li>
                    <li>• {t('priority_support')}</li>
                  </ul>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  {t('upgrade')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}