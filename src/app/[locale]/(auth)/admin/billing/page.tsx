import { headers } from 'next/headers'
import Link from 'next/link'

import { auth } from '@clerk/nextjs/server'
import { requireAnyRole } from '@/libs/rbac'

export default async function AdminBillingPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-2 text-gray-600">
            Manage your organization's subscription and payment information
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

      {/* Current Plan */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Current Plan
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Pro Plan</h4>
                <p className="text-gray-600">$49/month per organization</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">10</div>
                <div className="text-sm text-gray-600">Team Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">5</div>
                <div className="text-sm text-gray-600">Organizations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">50 GB</div>
                <div className="text-sm text-gray-600">Storage</div>
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Information */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Billing Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Next Billing Date</span>
              <span className="text-sm font-medium text-gray-900">December 1, 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Payment Method</span>
              <span className="text-sm font-medium text-gray-900">Visa ending in 4242</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Billing Email</span>
              <span className="text-sm font-medium text-gray-900">admin@example.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Payment History
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">November 1, 2024</p>
                <p className="text-sm text-gray-600">Pro Plan - Monthly</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">$49.00</p>
                <p className="text-sm text-green-600">Paid</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">October 1, 2024</p>
                <p className="text-sm text-gray-600">Pro Plan - Monthly</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">$49.00</p>
                <p className="text-sm text-green-600">Paid</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">September 1, 2024</p>
                <p className="text-sm text-gray-600">Pro Plan - Monthly</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">$49.00</p>
                <p className="text-sm text-green-600">Paid</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View Full Payment History
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Upgrade Options
          </h3>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Enterprise Plan</h4>
                  <p className="text-gray-600">$99/month per organization</p>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>• Unlimited team members</li>
                    <li>• Unlimited organizations</li>
                    <li>• 500 GB storage</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}