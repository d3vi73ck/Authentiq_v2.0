import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { eq, and, desc, count, sql } from 'drizzle-orm'
import { db } from '@/libs/DB'
import { submissionSchema, fileSchema, commentSchema } from '@/models/Schema'

/**
 * GET /api/submissions - List submissions for current organization
 * Query params: status, limit, offset
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
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where = and(
      eq(submissionSchema.organizationId, orgId),
      status ? eq(submissionSchema.status, status as any) : undefined
    )

    // Get submissions with pagination
    const submissions = await db
      .select({
        id: submissionSchema.id,
        type: submissionSchema.type,
        title: submissionSchema.title,
        amount: submissionSchema.amount,
        status: submissionSchema.status,
        createdAt: submissionSchema.createdAt,
      })
      .from(submissionSchema)
      .where(where)
      .orderBy(desc(submissionSchema.createdAt))
      .limit(limit)
      .offset(offset)

    // Get files and comments count for each submission
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

        const commentsCount = await db
          .select({ count: count() })
          .from(commentSchema)
          .where(eq(commentSchema.submissionId, submission.id))

        return {
          ...submission,
          files,
          _count: {
            comments: commentsCount[0]?.count || 0
          }
        }
      })
    )

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(submissionSchema)
      .where(where)
    
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
    console.error('Get submissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/submissions - Create new submission
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
    const { type, title, amount, spentAt } = body

    // Validate required fields
    if (!type) {
      return NextResponse.json({ error: 'Expense type is required' }, { status: 400 })
    }

    // Create submission using Drizzle
    const [submission] = await db
      .insert(submissionSchema)
      .values({
        organizationId: orgId,
        type,
        title: title || null,
        amount: amount !== undefined && amount !== null ? amount.toString() : null,
        spentAt: spentAt ? new Date(spentAt) : null,
        status: 'DRAFT',
        createdBy: userId
      })
      .returning()

    if (!submission) {
      throw new Error('Failed to create submission')
    }

    // Get files for the submission
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

    const submissionWithFiles = {
      ...submission,
      files
    }

    return NextResponse.json({ submission: submissionWithFiles }, { status: 201 })

  } catch (error) {
    console.error('Create submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}