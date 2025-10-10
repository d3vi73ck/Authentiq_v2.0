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
export type UserRole = 'association' | 'member' | 'reviewer' | 'admin' | 'superadmin'

/**
 * Get user role from Clerk organization membership (Server only)
 */
export async function getUserRole(): Promise<UserRole | null> {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId) {
      return null
    }

    // Import clerkClient dynamically to avoid server-side issues
    const { clerkClient } = await import('@clerk/nextjs/server')
    
    // Fetch user organization memberships from Clerk
    const client = await clerkClient()
    
    // If no organization ID, fall back to association role
    if (!orgId) {
      return 'association'
    }

    // Get organization membership for the current user and organization
    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    })
    
    // If no memberships found, fall back to association role
    if (!memberships.data || memberships.data.length === 0) {
      return 'association'
    }

    // Get the first membership (should only be one for this user in this org)
    const membership = memberships.data[0]
    const clerkRole = membership?.role
    
    // If no role found in membership, fall back to association role
    if (!clerkRole) {
      return 'association'
    }
    
    // Map Clerk roles to RBAC roles
    // Clerk uses: 'org:admin', 'org:association', 'org:member', 'org:reviewer'
    // We map to: 'admin', 'association', 'member', 'reviewer'
    const roleMapping: Record<string, UserRole> = {
      'org:admin': 'admin',
      'org:association': 'association',
      'org:member': 'member',
      'org:reviewer': 'reviewer'
    }
    
    // Return mapped role or fall back to 'association' if no mapping found
    const mappedRole = roleMapping[clerkRole] || 'association'
    console.log('Mapped role:', mappedRole)
    return mappedRole
  } catch (error) {
    console.error('Error getting user role from organization membership:', error)
    // Fall back to association role on error
    return 'association'
  }
}

/**
 * Check if user can review submissions (Server only)
 * Review roles: reviewer, admin, superadmin
 */
export async function canReview(): Promise<boolean> {
  const role = await getUserRole()
  if (!role) return false
  
  const reviewRoles: UserRole[] = ['reviewer', 'admin', 'superadmin']
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
  
  const permissions = {
    role,
    canReview: await canReview(),
    canManageOrganization: await canManageOrganization(),
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin',
  }
  
  console.log('🔍 RBAC Server - User permissions:', permissions)
  return permissions
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