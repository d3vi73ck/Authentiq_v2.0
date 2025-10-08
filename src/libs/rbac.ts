import 'server-only'

import { auth } from '@clerk/nextjs/server'

/**
 * Role-based access control utilities for Clerk authentication
 * Uses Clerk user metadata for role management
 *
 * NOTE: These utilities are for SERVER COMPONENTS and API ROUTES only
 * For client components, use the client-side hooks and utilities
 */

// Define user roles
export type UserRole = 'user' | 'chef' | 'admin' | 'superadmin'

/**
 * Get user role from Clerk metadata (Server only)
 */
export async function getUserRole(): Promise<UserRole | null> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return null
    }

    // In a real implementation, you would fetch user metadata from Clerk
    // For now, we'll use a placeholder - you should implement this based on your Clerk setup
    // const user = await clerkClient.users.getUser(userId)
    // return user.publicMetadata?.role as UserRole || 'user'
    
    // Placeholder implementation - replace with actual Clerk metadata lookup
    return 'user'
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

/**
 * Check if user can review submissions (Server only)
 * Review roles: chef, admin, superadmin
 */
export async function canReview(): Promise<boolean> {
  const role = await getUserRole()
  if (!role) return false
  
  const reviewRoles: UserRole[] = ['chef', 'admin', 'superadmin']
  return reviewRoles.includes(role)
}

/**
 * Check if user can manage organization (Server only)
 * Admin roles: admin, superadmin
 */
export async function canManageOrganization(): Promise<boolean> {
  const role = await getUserRole()
  if (!role) return false
  
  const adminRoles: UserRole[] = ['admin', 'superadmin']
  return adminRoles.includes(role)
}

/**
 * Check if user has specific role (Server only)
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const role = await getUserRole()
  return role === requiredRole
}

/**
 * Check if user has any of the specified roles (Server only)
 */
export async function hasAnyRole(requiredRoles: UserRole[]): Promise<boolean> {
  const role = await getUserRole()
  if (!role) return false
  
  return requiredRoles.includes(role)
}

/**
 * Get user permissions object (Server only)
 */
export async function getUserPermissions() {
  const role = await getUserRole()
  
  return {
    role,
    canReview: await canReview(),
    canManageOrganization: await canManageOrganization(),
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin',
  }
}

/**
 * Middleware for role-based route protection (Server only)
 */
export async function requireRole(requiredRole: UserRole) {
  const role = await getUserRole()
  
  if (!role || role !== requiredRole) {
    throw new Error(`Access denied. Required role: ${requiredRole}`)
  }
}

/**
 * Middleware for any of multiple roles (Server only)
 */
export async function requireAnyRole(requiredRoles: UserRole[]) {
  const role = await getUserRole()
  
  if (!role || !requiredRoles.includes(role)) {
    throw new Error(`Access denied. Required one of: ${requiredRoles.join(', ')}`)
  }
}