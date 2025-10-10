import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { eq, and, desc, count, inArray } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { db } from '@/libs/DB'
import { submissionSchema, fileSchema, commentSchema } from '@/models/Schema'
import { canReview } from '@/libs/rbac'
import { fetchMultipleUsersInfo } from '@/utils/user-utils'

/**
 * GET /api/review - List submissions pending review for current organization
 * Query params: limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication using Clerk
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organization context required' }, { status: 400 })
    }

    // Check if user can review
    const canUserReview = await canReview()
    if (!canUserReview) {
      return NextResponse.json({ error: 'Insufficient permissions to review submissions' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get submissions pending review (SUBMITTED or IN_REVIEW status)
    const submissions = await db
      .select({
        id: submissionSchema.id,
        type: submissionSchema.type,
        title: submissionSchema.title,
        amount: submissionSchema.amount,
        status: submissionSchema.status,
        createdAt: submissionSchema.createdAt,
        createdBy: submissionSchema.createdBy,
      })
      .from(submissionSchema)
      .where(
        and(
          eq(submissionSchema.organizationId, orgId),
          inArray(submissionSchema.status, ['SUBMITTED', 'IN_REVIEW'])
        )
      )
      .orderBy(desc(submissionSchema.createdAt))
      .limit(limit)
      .offset(offset)

    // Get all user IDs from submissions and comments
    const userIds = new Set<string>()
    submissions.forEach(submission => userIds.add(submission.createdBy))
    
    // Get all comments to collect comment user IDs
    const allComments = await Promise.all(
      submissions.map(submission =>
        db
          .select({
            userId: commentSchema.userId,
          })
          .from(commentSchema)
          .where(eq(commentSchema.submissionId, submission.id))
      )
    )
    
    allComments.flat().forEach(comment => userIds.add(comment.userId))
    
    const userMap = await fetchMultipleUsersInfo(Array.from(userIds))

    // Get files and comments for each submission
    const submissionsWithRelations = await Promise.all(
      submissions.map(async (submission) => {
        const files = await db
          .select({
            id: fileSchema.id,
            kind: fileSchema.kind,
            size: fileSchema.size,
            mime: fileSchema.mime,
            createdAt: fileSchema.createdAt
          })
          .from(fileSchema)
          .where(eq(fileSchema.submissionId, submission.id))

        const comments = await db
          .select({
            id: commentSchema.id,
            text: commentSchema.text,
            decision: commentSchema.decision,
            createdAt: commentSchema.createdAt,
            userId: commentSchema.userId,
          })
          .from(commentSchema)
          .where(eq(commentSchema.submissionId, submission.id))
          .orderBy(commentSchema.createdAt)

        return {
          ...submission,
          files,
          comments: comments.map(comment => ({
            ...comment,
            user: userMap[comment.userId]
          })),
          user: userMap[submission.createdBy]
        }
      })
    )

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(submissionSchema)
      .where(
        and(
          eq(submissionSchema.organizationId, orgId),
          inArray(submissionSchema.status, ['SUBMITTED', 'IN_REVIEW'])
        )
      )
    
    const total = totalResult[0]?.count || 0

    return NextResponse.json({
      submissions: submissionsWithRelations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + submissions.length < total
      }
    })

  } catch (error) {
    console.error('Get review submissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/review - Submit review decision with comment
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication using Clerk
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organization context required' }, { status: 400 })
    }

    // Check if user can review
    const canUserReview = await canReview()
    if (!canUserReview) {
      return NextResponse.json({ error: 'Insufficient permissions to review submissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { submissionId, decision, comment } = body

    // Validate required fields
    if (!submissionId || !decision || !comment) {
      return NextResponse.json(
        { error: 'Submission ID, decision, and comment are required' },
        { status: 400 }
      )
    }

    // Validate decision
    if (!['APPROVE', 'REJECT'].includes(decision)) {
      return NextResponse.json(
        { error: 'Decision must be either APPROVE or REJECT' },
        { status: 400 }
      )
    }

    // Validate comment length
    if (comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      )
    }

    // Check if submission exists and belongs to organization
    const submission = await db
      .select()
      .from(submissionSchema)
      .where(
        and(
          eq(submissionSchema.id, submissionId),
          eq(submissionSchema.organizationId, orgId)
        )
      )
      .limit(1)

    if (!submission[0]) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check if submission is in reviewable state
    if (!['SUBMITTED', 'IN_REVIEW'].includes(submission[0].status)) {
      return NextResponse.json(
        { error: 'Submission is not in a reviewable state' },
        { status: 400 }
      )
    }

    // Update submission status and create comment in a transaction
    const updatedSubmission = await db.transaction(async (tx) => {
      // Update submission status
      const [updated] = await tx
        .update(submissionSchema)
        .set({
          status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
        })
        .where(eq(submissionSchema.id, submissionId))
        .returning()

      if (!updated) {
        throw new Error('Failed to update submission')
      }

      // Generate unique ID for comment using CUID2
      const commentId = createId()
      
      // Create review comment with decision
      const [reviewComment] = await tx
        .insert(commentSchema)
        .values({
          id: commentId,
          submissionId,
          userId,
          text: comment,
          decision: decision as 'APPROVE' | 'REJECT'
        })
        .returning()

      if (!reviewComment) {
        throw new Error('Failed to create review comment')
      }

      // Get files for the submission
      const files = await tx
        .select({
          id: fileSchema.id,
          kind: fileSchema.kind,
          size: fileSchema.size,
          mime: fileSchema.mime,
          createdAt: fileSchema.createdAt
        })
        .from(fileSchema)
        .where(eq(fileSchema.submissionId, submissionId))

      // Get all comments for the submission
      const comments = await tx
        .select()
        .from(commentSchema)
        .where(eq(commentSchema.submissionId, submissionId))
        .orderBy(commentSchema.createdAt)

      // Get user information for submission creator and comments
      const userIds = new Set<string>()
      userIds.add(updated.createdBy)
      comments.forEach(comment => userIds.add(comment.userId))
      
      const userMap = await fetchMultipleUsersInfo(Array.from(userIds))

      return {
        ...updated,
        files,
        comments: comments.map(comment => ({
          ...comment,
          user: userMap[comment.userId]
        })),
        user: userMap[updated.createdBy]
      }
    })

    // TODO: Send email notification (placeholder for later implementation)

    // Get reviewer user information
    const reviewerUserInfo = await fetchMultipleUsersInfo([userId])
    const reviewer = reviewerUserInfo[userId]

    return NextResponse.json({
      submission: updatedSubmission,
      comment: {
        id: updatedSubmission.comments[updatedSubmission.comments.length - 1]?.id,
        text: comment,
        decision,
        createdAt: new Date().toISOString(),
        user: {
          id: userId,
          email: reviewer?.email || 'Unknown User',
          role: 'reviewer' // This is the role context for the comment, not the user's actual role
        }
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Submit review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}