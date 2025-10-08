import { count, desc, eq, sql, sum } from 'drizzle-orm'

import { db } from './DB'
import { submissionSchema, fileSchema, commentSchema } from '@/models/Schema'

export interface SubmissionStats {
  total: number
  approved: number
  rejected: number
  pending: number
  draft: number
  totalAmount: number
  approvedAmount: number
}

export interface AnalyticsData {
  stats: SubmissionStats
  statusBreakdown: Array<{
    status: string
    count: number
    percentage: number
  }>
  recentActivity: Array<{
    id: string
    title: string
    status: string
    amount: number | null
    createdAt: Date
  }>
}

/**
 * Calculate submission statistics for a specific organization
 */
export async function getSubmissionStats(organizationId: string): Promise<SubmissionStats> {
  // Get total count and amount by status
  const statsResult = await db
    .select({
      status: submissionSchema.status,
      count: count(),
      totalAmount: sum(submissionSchema.amount)
    })
    .from(submissionSchema)
    .where(eq(submissionSchema.organizationId, organizationId))
    .groupBy(submissionSchema.status)

  // Initialize stats object
  const stats: SubmissionStats = {
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    draft: 0,
    totalAmount: 0,
    approvedAmount: 0
  }

  // Process results
  statsResult.forEach((row) => {
    const count = Number(row.count)
    const amount = row.totalAmount ? Number(row.totalAmount) : 0

    switch (row.status) {
      case 'APPROVED':
        stats.approved = count
        stats.approvedAmount = amount
        stats.totalAmount += amount
        break
      case 'REJECTED':
        stats.rejected = count
        break
      case 'IN_REVIEW':
        stats.pending = count
        stats.totalAmount += amount
        break
      case 'SUBMITTED':
        stats.pending += count
        stats.totalAmount += amount
        break
      case 'DRAFT':
        stats.draft = count
        break
    }
  })

  // Calculate total
  stats.total = stats.approved + stats.rejected + stats.pending + stats.draft

  return stats
}

/**
 * Get status breakdown with percentages
 */
export async function getStatusBreakdown(organizationId: string) {
  const stats = await getSubmissionStats(organizationId)
  
  if (stats.total === 0) {
    return []
  }

  return [
    { status: 'APPROVED', count: stats.approved, percentage: (stats.approved / stats.total) * 100 },
    { status: 'REJECTED', count: stats.rejected, percentage: (stats.rejected / stats.total) * 100 },
    { status: 'PENDING', count: stats.pending, percentage: (stats.pending / stats.total) * 100 },
    { status: 'DRAFT', count: stats.draft, percentage: (stats.draft / stats.total) * 100 }
  ]
}

/**
 * Get recent submission activity
 */
export async function getRecentActivity(organizationId: string, limit: number = 10) {
  const submissions = await db
    .select({
      id: submissionSchema.id,
      title: submissionSchema.title,
      status: submissionSchema.status,
      amount: submissionSchema.amount,
      createdAt: submissionSchema.createdAt
    })
    .from(submissionSchema)
    .where(eq(submissionSchema.organizationId, organizationId))
    .orderBy(desc(submissionSchema.createdAt))
    .limit(limit)

  return submissions.map((submission) => ({
    id: submission.id,
    title: submission.title || 'Untitled',
    status: submission.status,
    amount: submission.amount ? Number(submission.amount) : null,
    createdAt: submission.createdAt
  }))
}

/**
 * Get comprehensive analytics data for dashboard
 */
export async function getAnalyticsData(organizationId: string): Promise<AnalyticsData> {
  const [stats, statusBreakdown, recentActivity] = await Promise.all([
    getSubmissionStats(organizationId),
    getStatusBreakdown(organizationId),
    getRecentActivity(organizationId)
  ])

  return {
    stats,
    statusBreakdown,
    recentActivity
  }
}

/**
 * Get submissions data for export
 */
export async function getSubmissionsForExport(organizationId: string) {
  // Get submissions with file counts and comment info
  const submissions = await db
    .select({
      submission: submissionSchema,
      fileCount: sql<number>`COUNT(${fileSchema.id})`,
      totalFileSize: sql<number>`COALESCE(SUM(${fileSchema.size}), 0)`,
      hasComments: sql<boolean>`EXISTS(SELECT 1 FROM ${commentSchema} WHERE ${commentSchema.submissionId} = ${submissionSchema.id})`,
      lastDecision: sql<string | null>`
        (SELECT ${commentSchema.decision} FROM ${commentSchema} 
         WHERE ${commentSchema.submissionId} = ${submissionSchema.id} 
         ORDER BY ${commentSchema.createdAt} DESC LIMIT 1)
      `
    })
    .from(submissionSchema)
    .leftJoin(fileSchema, eq(submissionSchema.id, fileSchema.submissionId))
    .where(eq(submissionSchema.organizationId, organizationId))
    .groupBy(submissionSchema.id)
    .orderBy(desc(submissionSchema.createdAt))

  return submissions.map((row) => ({
    id: row.submission.id,
    type: row.submission.type,
    title: row.submission.title,
    amount: row.submission.amount ? Number(row.submission.amount) : null,
    status: row.submission.status,
    spentAt: row.submission.spentAt,
    createdAt: row.submission.createdAt,
    fileCount: Number(row.fileCount),
    totalFileSize: Number(row.totalFileSize),
    hasComments: row.hasComments,
    lastDecision: row.lastDecision
  }))
}