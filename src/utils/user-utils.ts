import { clerkClient } from '@clerk/nextjs/server'

export interface UserInfo {
  id: string
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
  role: string
}

/**
 * Fetch user information from Clerk by user ID
 */
export async function fetchUserInfo(userId: string): Promise<UserInfo> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    if (!user) {
      throw new Error(`User not found: ${userId}`)
    }

    const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || 'Unknown User'
    const firstName = user.firstName || ''
    const lastName = user.lastName || ''
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || email

    return {
      id: user.id,
      email,
      firstName,
      lastName,
      fullName,
      role: 'user' // Default role, can be enhanced with organization roles if needed
    }
  } catch (error) {
    console.error(`Error fetching user info for ${userId}:`, error)
    
    // Fallback user info when Clerk fetch fails
    return {
      id: userId,
      email: 'Unknown User',
      role: 'user'
    }
  }
}

/**
 * Fetch multiple users information from Clerk by user IDs
 */
export async function fetchMultipleUsersInfo(userIds: string[]): Promise<Record<string, UserInfo>> {
  try {
    const client = await clerkClient()
    const users = await client.users.getUserList({
      userId: userIds,
      limit: 100
    })

    const userMap: Record<string, UserInfo> = {}

    users.data.forEach(user => {
      const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || 'Unknown User'
      const firstName = user.firstName || ''
      const lastName = user.lastName || ''
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || email

      userMap[user.id] = {
        id: user.id,
        email,
        firstName,
        lastName,
        fullName,
        role: 'user'
      }
    })

    // Add fallback for any missing users
    userIds.forEach(userId => {
      if (!userMap[userId]) {
        userMap[userId] = {
          id: userId,
          email: 'Unknown User',
          role: 'user'
        }
      }
    })

    return userMap
  } catch (error) {
    console.error('Error fetching multiple users info:', error)
    
    // Fallback for all users when Clerk fetch fails
    const fallbackMap: Record<string, UserInfo> = {}
    userIds.forEach(userId => {
      fallbackMap[userId] = {
        id: userId,
        email: 'Unknown User',
        role: 'user'
      }
    })
    return fallbackMap
  }
}