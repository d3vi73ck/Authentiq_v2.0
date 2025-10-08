import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/libs/DB'
import { submissionSchema, commentSchema } from '@/models/Schema'
import { canReview } from '@/libs/rbac'

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

    // Add user information to comments (placeholder - in real implementation, fetch from Clerk)
    const commentsWithUsers = comments.map(comment => ({
      ...comment,
      user: {
        id: comment.userId,
        // In a real implementation, you would fetch user details from Clerk
        email: 'user@example.com', // Placeholder
        role: 'user' // Placeholder
      }
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

    // Create comment
    const [comment] = await db
      .insert(commentSchema)
      .values({
        submissionId,
        userId,
        text: text.trim()
      })
      .returning()

    if (!comment) {
      throw new Error('Failed to create comment')
    }

    // Add user information to comment (placeholder - in real implementation, fetch from Clerk)
    const commentWithUser = {
      ...comment,
      user: {
        id: userId,
        // In a real implementation, you would fetch user details from Clerk
        email: 'user@example.com', // Placeholder
        role: canUserReview ? 'reviewer' : 'user' // Placeholder
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