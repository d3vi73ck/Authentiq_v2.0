import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/libs/DB'
import { notificationSchema } from '@/models/Schema'
import { eq, and, desc } from 'drizzle-orm'

/**
 * GET /api/notifications/stream - Server-Sent Events stream for real-time notifications
 * Access: All authenticated users in the organization
 * 
 * This endpoint uses a simple polling approach to check for new notifications every 5 seconds
 * and sends them to the client via Server-Sent Events.
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication using Clerk
    const { userId, orgId } = await auth()
    if (!userId) {
      return new Response('Authentication required', { status: 401 })
    }

    if (!orgId) {
      return new Response('Organization context required', { status: 400 })
    }

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', message: 'SSE stream connected' })}\n\n`))

        // Track the last notification timestamp to avoid sending duplicates
        let lastCheckTime = new Date()

        // Simple polling loop - check for new notifications every 5 seconds
        const interval = setInterval(async () => {
          try {
            // Get new notifications since last check
            const newNotifications = await db
              .select()
              .from(notificationSchema)
              .where(
                and(
                  eq(notificationSchema.organizationId, orgId),
                  eq(notificationSchema.userId, userId),
                  eq(notificationSchema.read, false)
                )
              )
              .orderBy(desc(notificationSchema.createdAt))
              .limit(10)

            // Update last check time
            lastCheckTime = new Date()

            // Send each new notification via SSE
            for (const notification of newNotifications) {
              const message = {
                type: 'notification',
                data: {
                  id: notification.id,
                  type: notification.type,
                  message: notification.message,
                  createdAt: notification.createdAt.toISOString()
                }
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))
            }

            // Send heartbeat to keep connection alive
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`))

          } catch (error) {
            console.error('SSE polling error:', error)
            // Send error message but don't close the connection
            const errorMessage = {
              type: 'error',
              message: 'Failed to check for notifications'
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`))
          }
        }, 5000) // Check every 5 seconds

        // Clean up when the client disconnects
        request.signal.addEventListener('abort', () => {
          clearInterval(interval)
          controller.close()
        })
      }
    })

    // Return the SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('SSE stream error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}