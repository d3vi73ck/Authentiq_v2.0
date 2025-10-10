'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false)
  const t = useTranslations('Admin.export')

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
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Link
          href="/admin/reports"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          {t('back_to_reports')}
        </Link>
      </div>

      {/* Export Options */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {t('export_options')}
          </h3>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{t('csv_export')}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('csv_description')}
                  </p>
                  <ul className="text-sm text-gray-500 mt-2 space-y-1">
                    <li>• {t('csv_features.feature1')}</li>
                    <li>• {t('csv_features.feature2')}</li>
                    <li>• {t('csv_features.feature3')}</li>
                  </ul>
                </div>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? t('exporting') : t('download_csv')}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800">{t('export_information')}</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• {t('export_info_features.feature1')}</li>
              <li>• {t('export_info_features.feature2')}</li>
              <li>• {t('export_info_features.feature3')}</li>
              <li>• {t('export_info_features.feature4')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {t('quick_links')}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/admin/reports"
              className="inline-flex items-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('view_reports_dashboard')}
            </Link>
            <Link
              href="/submissions"
              className="inline-flex items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              {t('manage_submissions')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}