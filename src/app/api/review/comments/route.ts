import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { eq, and, desc } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { db } from '@/libs/DB'
import { submissionSchema, commentSchema } from '@/models/Schema'
import { canReview } from '@/libs/rbac'
import { fetchMultipleUsersInfo } from '@/utils/user-utils'

/**
 * GET /api/review/comments - Get comments for a submission
 * Query params: submissionId
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
    }

    // Verify submission belongs to organization
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
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Get comments for submission
    const comments = await db
      .select({
        id: commentSchema.id,
        text: commentSchema.text,
        decision: commentSchema.decision,
        createdAt: commentSchema.createdAt,
        userId: commentSchema.userId,
      })
      .from(commentSchema)
      .where(eq(commentSchema.submissionId, submissionId))
      .orderBy(desc(commentSchema.createdAt))

    // Get user information for comments
    const userIds = comments.map(comment => comment.userId)
    const userMap = await fetchMultipleUsersInfo(userIds)

    const commentsWithUsers = comments.map(comment => ({
      ...comment,
      user: userMap[comment.userId]
    }))

    return NextResponse.json({ comments: commentsWithUsers })

  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/review/comments - Add comment to submission
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

    // Parse request body
    const body = await request.json()
    const { submissionId, text } = body

    // Validate required fields
    if (!submissionId || !text) {
      return NextResponse.json(
        { error: 'Submission ID and text are required' },
        { status: 400 }
      )
    }

    // Validate comment length
    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      )
    }

    // Verify submission belongs to organization
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
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if user can comment (must be able to review or be the submitter)
    const canUserReview = await canReview()
    const isSubmitter = submission[0].createdBy === userId

    if (!canUserReview && !isSubmitter) {
      return NextResponse.json(
        { error: 'Insufficient permissions to comment on this submission' },
        { status: 403 }
      )
    }

    // Generate unique ID for comment using CUID2
    const commentId = createId()
    
    // Create comment
    const [comment] = await db
      .insert(commentSchema)
      .values({
        id: commentId,
        submissionId,
        userId,
        text: text.trim()
      })
      .returning()

    if (!comment) {
      throw new Error('Failed to create comment')
    }

    // Get user information for comment author
    const userMap = await fetchMultipleUsersInfo([userId])
    const user = userMap[userId]

    const commentWithUser = {
      ...comment,
      user: {
        id: userId,
        email: user?.email || 'Unknown User',
        role: canUserReview ? 'reviewer' : 'association' // This is the role context for the comment, not the user's actual role
      }
    }

    return NextResponse.json({ comment: commentWithUser }, { status: 201 })

  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}