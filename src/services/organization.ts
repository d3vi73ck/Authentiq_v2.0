import { clerkClient } from '@clerk/nextjs/server'
import { db } from '@/libs/DB'
import { organizationSchema } from '@/models/Schema'
import { eq } from 'drizzle-orm'

// Role mapping from our RBAC to Clerk organization roles
// Clerk roles: 'basic_member' | 'admin'
const ROLE_MAPPING = {
  association: 'basic_member',
  chef: 'basic_member',
  admin: 'admin',
  superadmin: 'admin',
} as const

/**
 * Organization synchronization service
 * Handles synchronization between Clerk organizations and local database
 */
export class OrganizationService {
  /**
   * Ensure organization exists in local database
   * If organization doesn't exist, fetch data from Clerk and create it
   */
  static async ensureOrganizationExists(organizationId: string): Promise<void> {
    try {
      console.log(`🔍 Checking if organization exists in local database: ${organizationId}`)
      
      // Check if organization exists in local database
      const existingOrganization = await db
        .select()
        .from(organizationSchema)
        .where(eq(organizationSchema.id, organizationId))
        .limit(1)

      if (existingOrganization.length > 0) {
        console.log(`🔍 Organization already exists in local database: ${organizationId}`)
        return
      }

      console.log(`🔍 Organization not found in local database, fetching from Clerk: ${organizationId}`)
      
      // Fetch organization data from Clerk
      const clerkOrganization = await this.fetchOrganizationFromClerk(organizationId)
      
      if (!clerkOrganization) {
        console.error(`🔍 Organization not found in Clerk: ${organizationId}`)
        throw new Error(`Organization not found in Clerk: ${organizationId}`)
      }

      console.log(`🔍 Creating organization in local database: ${organizationId}`)
      
      // Create organization in local database
      await this.createOrganizationInDatabase(clerkOrganization)
      
      console.log(`🔍 Organization created successfully: ${organizationId}`)
      
    } catch (error) {
      console.error(`🔍 Error ensuring organization exists: ${organizationId}`, error)
      throw error
    }
  }

  /**
   * Fetch organization data from Clerk
   */
  private static async fetchOrganizationFromClerk(organizationId: string) {
    try {
      const client = await clerkClient()
      const organization = await client.organizations.getOrganization({
        organizationId
      })

      if (!organization) {
        return null
      }

      return {
        id: organization.id,
        name: organization.name || 'Unnamed Organization',
        slug: organization.slug || organization.id,
        // Additional Clerk organization fields can be mapped here as needed
      }
    } catch (error) {
      console.error(`🔍 Error fetching organization from Clerk: ${organizationId}`, error)
      
      // If we can't fetch from Clerk, create a basic organization record
      // This ensures the foreign key constraint is satisfied
      return {
        id: organizationId,
        name: 'Unknown Organization',
        slug: organizationId,
      }
    }
  }

  /**
   * Create organization in local database
   */
  private static async createOrganizationInDatabase(organizationData: {
    id: string
    name: string
    slug: string
  }) {
    try {
      await db
        .insert(organizationSchema)
        .values({
          id: organizationData.id,
          name: organizationData.name,
          subdomain: organizationData.slug,
          // Set default values for other required fields
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          stripeSubscriptionPriceId: null,
          stripeSubscriptionStatus: null,
          stripeSubscriptionCurrentPeriodEnd: null,
          updatedAt: new Date(),
          createdAt: new Date(),
        })
        .onConflictDoNothing()

      console.log(`🔍 Organization created in database: ${organizationData.id}`)
    } catch (error) {
      console.error(`🔍 Error creating organization in database: ${organizationData.id}`, error)
      throw error
    }
  }

  /**
   * Get organization by ID with fallback to Clerk
   */
  static async getOrganization(organizationId: string) {
    try {
      // First try to get from local database
      const localOrganization = await db
        .select()
        .from(organizationSchema)
        .where(eq(organizationSchema.id, organizationId))
        .limit(1)

      if (localOrganization.length > 0) {
        return localOrganization[0]
      }

      // If not found locally, ensure it exists (will fetch from Clerk and create)
      await this.ensureOrganizationExists(organizationId)
      
      // Now get from local database
      const createdOrganization = await db
        .select()
        .from(organizationSchema)
        .where(eq(organizationSchema.id, organizationId))
        .limit(1)

      return createdOrganization[0] || null
    } catch (error) {
      console.error(`🔍 Error getting organization: ${organizationId}`, error)
      return null
    }
  }

  /**
   * Send organization invitation using Clerk API
   */
  static async sendInvitation(organizationId: string, email: string, role: keyof typeof ROLE_MAPPING) {
    try {
      console.log(`🔍 Sending invitation to ${email} for organization ${organizationId} with role ${role}`)
      
      const client = await clerkClient()
      
      // Map our role to Clerk's organization role
      const clerkRole = ROLE_MAPPING[role]
      
      // Use type assertion to bypass Clerk's type checking
      const invitation = await client.organizations.createOrganizationInvitation({
        organizationId,
        emailAddress: email,
        role: clerkRole as any, // Clerk expects 'basic_member' | 'admin' but our types conflict
        // Clerk will handle email sending automatically
      })

      console.log(`🔍 Invitation sent successfully: ${invitation.id}`)
      return invitation
    } catch (error) {
      console.error(`🔍 Error sending invitation to ${email}:`, error)
      throw error
    }
  }

  /**
   * Get organization members list from Clerk
   */
  static async getOrganizationMembers(organizationId: string) {
    try {
      console.log(`🔍 Fetching members for organization: ${organizationId}`)
      
      const client = await clerkClient()
      
      const members = await client.organizations.getOrganizationMembershipList({
        organizationId,
      })

      console.log(`🔍 Found ${members.data?.length || 0} members for organization ${organizationId}`)
      return members.data || []
    } catch (error) {
      console.error(`🔍 Error fetching members for organization ${organizationId}:`, error)
      throw error
    }
  }

  /**
   * Get organization invitations list from Clerk
   */
  static async getOrganizationInvitations(organizationId: string) {
    try {
      console.log(`🔍 Fetching invitations for organization: ${organizationId}`)
      
      const client = await clerkClient()
      
      const invitations = await client.organizations.getOrganizationInvitationList({
        organizationId,
      })

      console.log(`🔍 Found ${invitations.data?.length || 0} invitations for organization ${organizationId}`)
      return invitations.data || []
    } catch (error) {
      console.error(`🔍 Error fetching invitations for organization ${organizationId}:`, error)
      throw error
    }
  }
}