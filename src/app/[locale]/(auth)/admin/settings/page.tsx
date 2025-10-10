import { headers } from 'next/headers'
import Link from 'next/link'

import { auth } from '@clerk/nextjs/server'
import { requireAnyRole } from '@/libs/rbac'

export default async function AdminSettingsPage() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your organization's configuration and system preferences
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Organization Settings */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Organization Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="organization-name" className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input
                type="text"
                id="organization-name"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter organization name"
              />
            </div>
            <div>
              <label htmlFor="organization-email" className="block text-sm font-medium text-gray-700">
                Contact Email
              </label>
              <input
                type="email"
                id="organization-email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter contact email"
              />
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
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
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            System Preferences
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
                Email notifications for new submissions
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="auto-approval"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="auto-approval" className="ml-2 block text-sm text-gray-900">
                Enable auto-approval for low-value expenses
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
                Enable AI document analysis
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Storage Information
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Used Storage</span>
              <span>2.5 GB / 10 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
            <p className="text-sm text-gray-500">
              25% of your storage quota used
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}