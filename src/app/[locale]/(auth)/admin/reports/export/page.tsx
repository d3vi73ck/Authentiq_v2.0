'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/exports')
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `submissions-export-${new Date().toISOString().split('T')[0]}.csv`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
          <p className="mt-2 text-gray-600">
            Download your organization's expense submission data
          </p>
        </div>
        <Link
          href="/admin/reports"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Reports
        </Link>
      </div>

      {/* Export Options */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Export Options
          </h3>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">CSV Export</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Download all submission data in CSV format for analysis in Excel or other tools
                  </p>
                  <ul className="text-sm text-gray-500 mt-2 space-y-1">
                    <li>• Includes all submission fields and metadata</li>
                    <li>• Compatible with Excel, Google Sheets, and data analysis tools</li>
                    <li>• Contains file counts and comment information</li>
                  </ul>
                </div>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? 'Exporting...' : 'Download CSV'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800">Export Information</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Data is filtered to your organization only</li>
              <li>• Includes submissions from all statuses (draft, submitted, approved, rejected)</li>
              <li>• Export contains submission dates, amounts, file information, and review decisions</li>
              <li>• File will be downloaded immediately when you click "Download CSV"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quick Links
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/admin/reports"
              className="inline-flex items-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View Reports Dashboard
            </Link>
            <Link
              href="/submissions"
              className="inline-flex items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Manage Submissions
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}