import { db } from '@/libs/DB'
import { notificationSchema } from '@/models/Schema'
import { createId } from '@paralleldrive/cuid2'

export interface CreateNotificationParams {
  organizationId: string
  userId: string
  type: string
  message: string
}

/**
 * NotificationService - Simple service for creating and managing notifications
 */
export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      const notificationId = createId()
      
      const [notification] = await db
        .insert(notificationSchema)
        .values({
          id: notificationId,
          organizationId: params.organizationId,
          userId: params.userId,
          type: params.type,
          message: params.message,
          read: false
        })
        .returning()

      return notification
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  /**
   * Create notification for submission status change
   */
  static async createSubmissionNotification(
    organizationId: string,
    userId: string,
    submissionId: string,
    status: string,
    actionBy?: string
  ) {
    const actionText = actionBy ? ` by ${actionBy}` : ''
    const message = `Submission ${submissionId} has been ${status.toLowerCase()}${actionText}`

    return await this.createNotification({
      organizationId,
      userId,
      type: 'submission_status_change',
      message
    })
  }

  /**
   * Create notification for new comment
   */
  static async createCommentNotification(
    organizationId: string,
    userId: string,
    submissionId: string,
    commentBy?: string
  ) {
    const commentText = commentBy ? ` by ${commentBy}` : ''
    const message = `New comment on submission ${submissionId}${commentText}`

    return await this.createNotification({
      organizationId,
      userId,
      type: 'new_comment',
      message
    })
  }

  /**
   * Create system notification
   */
  static async createSystemNotification(
    organizationId: string,
    userId: string,
    message: string
  ) {
    return await this.createNotification({
      organizationId,
      userId,
      type: 'system',
      message
    })
  }
}