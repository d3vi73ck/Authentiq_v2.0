import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { OrganizationService } from '@/services/organization'
import { canManageOrganization } from '@/libs/rbac'

/**
 * GET /api/organization/members - List organization members
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
        { error: 'Insufficient permissions to view organization members' },
        { status: 403 }
      )
    }

    // Get members using OrganizationService
    const members = await OrganizationService.getOrganizationMembers(orgId)

    return NextResponse.json({
      members: members.map(member => ({
        id: member.id,
        userId: member.publicUserData?.userId,
        firstName: member.publicUserData?.firstName,
        lastName: member.publicUserData?.lastName,
        email: member.publicUserData?.identifier,
        imageUrl: member.publicUserData?.imageUrl,
        role: member.role,
        createdAt: member.createdAt
      }))
    })

  } catch (error) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}