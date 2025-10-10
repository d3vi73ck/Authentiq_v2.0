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

// Map Clerk organization roles to RBAC roles
// Clerk uses: 'org:admin', 'org:member', 'org:basic_member'
// We map to: 'admin', 'chef', 'user'
const roleMapping: Record<string, UserRole> = {
  'org:admin': 'admin',
  'org:member': 'chef',
  'org:basic_member': 'user'
}

console.log('🔍 RBAC Client - Available role mappings:', roleMapping);

/**
 * Check if user can review submissions (Client only)
 * Review roles: chef, admin, superadmin
 */
export function useCanReview(): boolean {
  const { user, isLoaded: userLoaded } = useUser()
  const { organization, isLoaded: orgLoaded, membership } = useOrganization()
  
  console.log('🔍 useCanReview - Starting check:', {
    userLoaded,
    hasUser: !!user,
    orgLoaded,
    hasOrganization: !!organization,
    hasMembership: !!membership
  })
  
  if (!userLoaded || !orgLoaded || !user) {
    console.log('🔍 useCanReview - Not fully loaded or no user, returning false')
    return false
  }
  
  // Get role from organization membership (primary method) - matches server-side logic
  let role: UserRole = 'user'
  
  if (organization && membership) {
    const clerkRole = membership.role
    
    console.log('🔍 useCanReview - Raw Clerk membership data:', {
      membership,
      clerkRole,
      organizationName: organization.name,
      availableRoles: Object.keys(roleMapping)
    })
    
    if (clerkRole) {
      // Map Clerk organization role to RBAC role (matches server-side mapping)
      role = roleMapping[clerkRole] || 'user'
      console.log('🔍 useCanReview - Organization role mapping:', {
        clerkRole,
        mappedRole: role,
        organization: organization.name,
        mappingFound: !!roleMapping[clerkRole]
      })
    } else {
      console.log('🔍 useCanReview - No organization membership role found, defaulting to user')
    }
  } else {
    console.log('🔍 useCanReview - No organization context or membership, defaulting to user role')
  }
  
  // Fallback: Check user metadata if no organization role found
  if (role === 'user' && user.publicMetadata?.role) {
    role = user.publicMetadata.role as UserRole
    console.log('🔍 useCanReview - Using role from user metadata:', role)
  }
  
  const reviewRoles: UserRole[] = ['chef', 'admin', 'superadmin']
  const canReview = reviewRoles.includes(role)
  
  console.log('🔍 useCanReview - Final result:', {
    role,
    reviewRoles,
    canReview,
    note: 'Now checks organization membership like server-side version'
  })
  
  return canReview
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
    
    console.log('🔍 RBAC Client - Raw Clerk membership data:', {
      membership,
      clerkRole,
      organizationName: organization.name,
      availableRoles: Object.keys(roleMapping)
    })
    
    if (clerkRole) {
      // Map Clerk organization role to RBAC role
      role = roleMapping[clerkRole] || 'user'
      console.log('🔍 RBAC Client - Organization role mapping:', {
        clerkRole,
        mappedRole: role,
        organization: organization.name,
        mappingFound: !!roleMapping[clerkRole]
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