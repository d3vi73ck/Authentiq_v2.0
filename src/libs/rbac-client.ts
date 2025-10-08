'use client'

import { useUser } from '@clerk/nextjs'

/**
 * Client-side role-based access control utilities for Clerk authentication
 * Uses Clerk user metadata for role management
 *
 * NOTE: These utilities are for CLIENT COMPONENTS only
 * For server components and API routes, use the server-side utilities
 */

// Define user roles
export type UserRole = 'user' | 'chef' | 'admin' | 'superadmin'

/**
 * Check if user can review submissions (Client only)
 * Review roles: chef, admin, superadmin
 */
export function useCanReview(): boolean {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded || !user) return false
  
  // In a real implementation, you would check user metadata from Clerk
  // For now, we'll use a placeholder - you should implement this based on your Clerk setup
  // const role = user.publicMetadata?.role as UserRole || 'user'
  
  // Placeholder implementation - replace with actual Clerk metadata lookup
  const role: UserRole = 'user' // Default to user role
  
  const reviewRoles: UserRole[] = ['chef', 'admin', 'superadmin']
  return reviewRoles.includes(role)
}

/**
 * Check if user can manage organization (Client only)
 * Admin roles: admin, superadmin
 */
export function useCanManageOrganization(): boolean {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded || !user) return false
  
  // Retrieve role from Clerk user metadata, default to 'user' if not set
  const role: UserRole = (user.publicMetadata?.role as UserRole) || 'user'
  
  const adminRoles: UserRole[] = ['admin', 'superadmin']
  return adminRoles.includes(role)
}

/**
 * Get user permissions object (Client only)
 */
export function useUserPermissions() {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded || !user) {
    return {
      role: null as UserRole | null,
      canReview: false,
      canManageOrganization: false,
      isAdmin: false,
      isSuperAdmin: false,
    }
  }
  
  // Retrieve role from Clerk user metadata, default to 'user' if not set
  const role: UserRole = (user.publicMetadata?.role as UserRole) || 'user'
  
  const reviewRoles: UserRole[] = ['chef', 'admin', 'superadmin']
  const adminRoles: UserRole[] = ['admin', 'superadmin']
  
  return {
    role,
    canReview: reviewRoles.includes(role),
    canManageOrganization: adminRoles.includes(role),
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin',
  }
}