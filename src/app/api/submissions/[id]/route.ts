import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/libs/DB'
import { submissionSchema, fileSchema, commentSchema } from '@/models/Schema'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/submissions/[id] - Get submission details
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(
    
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check authentication using Clerk
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organization context required' }, { status: 400 })
    }

    const submissionId = params.id

    // Get submission with organization check
    const submission = await db
      .select()
      .from(submissionSchema)
      .where(
        and(
          eq(submissionSchema.id, submissionId),
          eq(submissionSchema.organizationId, orgId)
        )
      )
      .then(rows => rows[0])

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Get files for the submission
    const files = await db
      .select()
      .from(fileSchema)
      .where(eq(fileSchema.submissionId, submissionId))

    // Get comments for the submission
    const comments = await db
      .select()
      .from(commentSchema)
      .where(eq(commentSchema.submissionId, submissionId))
      .orderBy(commentSchema.createdAt)

    const submissionWithRelations = {
      ...submission,
      files,
      comments
    }

    return NextResponse.json({ submission: submissionWithRelations })

  } catch (error) {
    console.error('Get submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/submissions/[id] - Update submission
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check authentication using Clerk
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organization context required' }, { status: 400 })
    }

    const submissionId = params.id

    // Parse request body
    const body = await request.json()
    const { title, amount, spentAt, status } = body

    // Check if submission exists and belongs to organization
    const existingSubmission = await db
      .select()
      .from(submissionSchema)
      .where(
        and(
          eq(submissionSchema.id, submissionId),
          eq(submissionSchema.organizationId, orgId)
        )
      )
      .then(rows => rows[0])

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title || null
    if (amount !== undefined) updateData.amount = amount ? amount.toString() : null
    if (spentAt !== undefined) updateData.spentAt = spentAt ? new Date(spentAt) : null
    if (status !== undefined) updateData.status = status

    // Update submission
    const [updatedSubmission] = await db
      .update(submissionSchema)
      .set(updateData)
      .where(
        and(
          eq(submissionSchema.id, submissionId),
          eq(submissionSchema.organizationId, orgId)
        )
      )
      .returning()

    if (!updatedSubmission) {
      throw new Error('Failed to update submission')
    }

    // Get files for the submission
    const files = await db
      .select()
      .from(fileSchema)
      .where(eq(fileSchema.submissionId, submissionId))

    // Get comments for the submission
    const comments = await db
      .select()
      .from(commentSchema)
      .where(eq(commentSchema.submissionId, submissionId))
      .orderBy(commentSchema.createdAt)

    const submissionWithRelations = {
      ...updatedSubmission,
      files,
      comments
    }

    return NextResponse.json({ submission: submissionWithRelations })

  } catch (error) {
    console.error('Update submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}