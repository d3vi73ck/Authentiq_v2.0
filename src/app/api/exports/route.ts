import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

import { auth } from '@clerk/nextjs/server'
import { requireAnyRole } from '@/libs/rbac'
import { getSubmissionsForExport } from '@/libs/analytics'

export async function GET() {
  try {
    const headersList = await headers()
    const organizationId = headersList.get('x-organization-id')
    await auth()

    // Check authentication and admin privileges
    try {
      await requireAnyRole(['admin', 'superadmin'])
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      )
    }

    // Get submissions data for export
    const submissions = await getSubmissionsForExport(organizationId)

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Type',
      'Title',
      'Amount (€)',
      'Status',
      'Spent Date',
      'Created Date',
      'File Count',
      'Total File Size (bytes)',
      'Has Comments',
      'Last Decision'
    ]

    const csvRows = submissions.map(submission => [
      submission.id,
      submission.type,
      submission.title || '',
      submission.amount || '',
      submission.status,
      submission.spentAt ? new Date(submission.spentAt).toISOString().split('T')[0] : '',
      new Date(submission.createdAt).toISOString().split('T')[0],
      submission.fileCount,
      submission.totalFileSize,
      submission.hasComments ? 'Yes' : 'No',
      submission.lastDecision || ''
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Create response with CSV file
    const response = new NextResponse(csvContent)
    response.headers.set('Content-Type', 'text/csv')
    response.headers.set('Content-Disposition', `attachment; filename="submissions-export-${new Date().toISOString().split('T')[0]}.csv"`)
    
    return response

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const organizationId = headersList.get('x-organization-id')
    await auth()

    // Check authentication and admin privileges
    try {
      await requireAnyRole(['admin', 'superadmin'])
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      )
    }

    const { format = 'csv' } = await request.json()

    if (format !== 'csv') {
      return NextResponse.json(
        { error: 'Only CSV format is currently supported' },
        { status: 400 }
      )
    }

    // Get submissions data for export
    const submissions = await getSubmissionsForExport(organizationId)

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Type',
      'Title',
      'Amount (€)',
      'Status',
      'Spent Date',
      'Created Date',
      'File Count',
      'Total File Size (bytes)',
      'Has Comments',
      'Last Decision'
    ]

    const csvRows = submissions.map(submission => [
      submission.id,
      submission.type,
      submission.title || '',
      submission.amount || '',
      submission.status,
      submission.spentAt ? new Date(submission.spentAt).toISOString().split('T')[0] : '',
      new Date(submission.createdAt).toISOString().split('T')[0],
      submission.fileCount,
      submission.totalFileSize,
      submission.hasComments ? 'Yes' : 'No',
      submission.lastDecision || ''
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return NextResponse.json({
      success: true,
      data: csvContent,
      filename: `submissions-export-${new Date().toISOString().split('T')[0]}.csv`,
      recordCount: submissions.length
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}