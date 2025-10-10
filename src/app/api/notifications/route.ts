import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/libs/DB'
import { notificationSchema } from '@/models/Schema'
import { eq, and, desc, count } from 'drizzle-orm'

/**
 * GET /api/notifications - List notifications for current user
 * Query params: read, limit, offset
 * Access: All authenticated users in the organization
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
    const read = searchParams.get('read')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where = and(
      eq(notificationSchema.organizationId, orgId),
      eq(notificationSchema.userId, userId),
      read !== null ? eq(notificationSchema.read, read === 'true') : undefined
    )

    // Get notifications with pagination
    const notifications = await db
      .select()
      .from(notificationSchema)
      .where(where)
      .orderBy(desc(notificationSchema.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(notificationSchema)
      .where(where)
    
    const total = totalResult[0]?.count || 0

    // Get unread count
    const unreadResult = await db
      .select({ count: count() })
      .from(notificationSchema)
      .where(
        and(
          eq(notificationSchema.organizationId, orgId),
          eq(notificationSchema.userId, userId),
          eq(notificationSchema.read, false)
        )
      )
    
    const unreadCount = unreadResult[0]?.count || 0

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + notifications.length < total
      },
      unreadCount
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications - Mark notifications as read
 * Body: { notificationIds: string[] } or { markAll: true }
 * Access: All authenticated users in the organization
 */
export async function PATCH(request: NextRequest) {
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
    const { notificationIds, markAll } = body

    if (!notificationIds && !markAll) {
      return NextResponse.json(
        { error: 'Either notificationIds or markAll is required' },
        { status: 400 }
      )
    }

    let result

    if (markAll) {
      // Mark all notifications as read for this user in the organization
      result = await db
        .update(notificationSchema)
        .set({ read: true })
        .where(
          and(
            eq(notificationSchema.organizationId, orgId),
            eq(notificationSchema.userId, userId),
            eq(notificationSchema.read, false)
          )
        )
        .returning()
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      // Since Drizzle doesn't have a direct "in" operator, we'll update each one individually
      const updatePromises = notificationIds.map(async (notificationId: string) => {
        return await db
          .update(notificationSchema)
          .set({ read: true })
          .where(
            and(
              eq(notificationSchema.organizationId, orgId),
              eq(notificationSchema.userId, userId),
              eq(notificationSchema.id, notificationId)
            )
          )
          .returning()
      })
      
      const results = await Promise.all(updatePromises)
      result = results.flat()
    } else {
      return NextResponse.json(
        { error: 'Invalid notificationIds format' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Notifications marked as read',
      updatedCount: result.length
    })

  } catch (error) {
    console.error('Mark notifications as read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}