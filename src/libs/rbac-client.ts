'use client'

import { useOrganization, useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

/**
 * Client-side role-based access control utilities for Clerk authentication
 * Uses Clerk organization membership for role management
 *
 * NOTE: These utilities are for CLIENT COMPONENTS only
 * For server components and API routes, use the server-side utilities
 */

// Define user roles
export type UserRole = 'user' | 'chef' | 'admin' | 'superadmin'

// Map Clerk organization roles to RBAC roles (matches server-side mapping)
const roleMapping: Record<string, UserRole> = {
  'org:admin': 'admin',
  'org:association': 'chef',
  'org:member': 'user'
}

/**
 * Check if user can review submissions (Client only)
 * Review roles: chef, admin, superadmin
 */
export function useCanReview(): boolean {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded || !user) {
    return false
  }
  
  // Retrieve role from Clerk user metadata, default to 'user' if not set
  const role: UserRole = (user.publicMetadata?.role as UserRole) || 'user'
  
  const reviewRoles: UserRole[] = ['chef', 'admin', 'superadmin']
  return reviewRoles.includes(role)
}

/**
 * Check if user can manage organization (Client only)
 * Admin roles: admin, superadmin
 */
export function useCanManageOrganization(): boolean {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded || !user) {
    return false
  }
  
  // Retrieve role from Clerk user metadata, default to 'user' if not set
  const role: UserRole = (user.publicMetadata?.role as UserRole) || 'user'
  
  const adminRoles: UserRole[] = ['admin', 'superadmin']
  return adminRoles.includes(role)
}

/**
 * Get user permissions object (Client only)
 */
export function useUserPermissions() {
  const { user, isLoaded: userLoaded } = useUser()
  const { organization, isLoaded: orgLoaded, membership } = useOrganization()
  
  // Return loading state with null role if not fully loaded
  if (!userLoaded || !orgLoaded) {
    return {
      role: null as UserRole | null,
      canReview: false,
      canManageOrganization: false,
      isAdmin: false,
      isSuperAdmin: false,
      isLoading: true
    }
  }
  
  // Return default permissions if user is not authenticated
  if (!user) {
    return {
      role: 'user' as UserRole,
      canReview: false,
      canManageOrganization: false,
      isAdmin: false,
      isSuperAdmin: false,
      isLoading: false
    }
  }
  
  // Get role from organization membership (primary method)
  let role: UserRole = 'user'
  
  if (organization && membership) {
    const clerkRole = membership.role
    
    if (clerkRole) {
      // Map Clerk organization role to RBAC role
      role = roleMapping[clerkRole] || 'user'
      console.log('🔍 RBAC Client - Organization role mapping:', {
        clerkRole,
        mappedRole: role,
        organization: organization.name
      })
    } else {
      console.log('🔍 RBAC Client - No organization membership role found, defaulting to user')
    }
  } else {
    console.log('🔍 RBAC Client - No organization context or membership, defaulting to user role')
  }
  
  // Fallback: Check user metadata if no organization role found
  if (role === 'user' && user.publicMetadata?.role) {
    role = user.publicMetadata.role as UserRole
    console.log('🔍 RBAC Client - Using role from user metadata:', role)
  }
  
  console.log('🔍 RBAC Client - Final role determination:', {
    organization: organization?.name,
    finalRole: role
  })
  
  const reviewRoles: UserRole[] = ['chef', 'admin', 'superadmin']
  const adminRoles: UserRole[] = ['admin', 'superadmin']
  
  const permissions = {
    role,
    canReview: reviewRoles.includes(role),
    canManageOrganization: adminRoles.includes(role),
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin',
    isLoading: false
  }
  
  console.log('🔍 RBAC Client - Final permissions:', permissions)
  return permissions
}