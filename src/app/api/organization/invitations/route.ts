import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { OrganizationService } from '@/services/organization'
import { canManageOrganization } from '@/libs/rbac'

// Define allowed roles for invitations
const ALLOWED_ROLES = ['association', 'member', 'reviewer', 'admin', 'superadmin'] as const
type AllowedRole = typeof ALLOWED_ROLES[number]

/**
 * POST /api/organization/invitations - Send organization invitation
 * Requires: admin or superadmin role
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

    // Check if user can manage organization
    const canUserManageOrg = await canManageOrganization()
    if (!canUserManageOrg) {
      return NextResponse.json(
        { error: 'Insufficient permissions to send invitations' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { email, role } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    // Validate role is one of the allowed values
    if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Send invitation using OrganizationService
    const invitation = await OrganizationService.sendInvitation(
      orgId,
      email,
      role as AllowedRole
    )

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        emailAddress: invitation.emailAddress,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Send invitation error:', error)
    
    // Handle specific Clerk errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 400 }
        )
      }
      if (error.message.includes('already invited')) {
        return NextResponse.json(
          { error: 'User has already been invited to this organization' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/organization/invitations - List organization invitations
 * Requires: admin or superadmin role
 */
export async function GET() {
  try {
    // Check authentication using Clerk
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organization context required' }, { status: 400 })
    }

    // Check if user can manage organization
    const canUserManageOrg = await canManageOrganization()
    if (!canUserManageOrg) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view invitations' },
        { status: 403 }
      )
    }

    // Get invitations using OrganizationService
    const invitations = await OrganizationService.getOrganizationInvitations(orgId)

    return NextResponse.json({
      invitations: invitations.map(invitation => ({
        id: invitation.id,
        emailAddress: invitation.emailAddress,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt
      }))
    })

  } catch (error) {
    console.error('Get invitations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}