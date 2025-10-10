'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TitleBar } from '@/features/dashboard/TitleBar'
import { useCanManageOrganization } from '@/libs/rbac-client'

interface Member {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  email?: string
  imageUrl?: string
  role: string
  createdAt: string
}

interface Invitation {
  id: string
  emailAddress: string
  role: string
  status: string
  createdAt: string
}

export default function OrganizationMembersPage() {
  const t = useTranslations('OrganizationMembers')
  const canManageOrganization = useCanManageOrganization()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('association')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadMembers()
    loadInvitations()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/organization/members')
      
      if (!response.ok) {
        throw new Error('Failed to load members')
      }
      
      const data = await response.json()
      setMembers(data.members)
    } catch (error) {
      console.error('Load members error:', error)
      setError('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const loadInvitations = async () => {
    try {
      const response = await fetch('/api/organization/invitations')
      
      if (!response.ok) {
        throw new Error('Failed to load invitations')
      }
      
      const data = await response.json()
      setInvitations(data.invitations)
    } catch (error) {
      console.error('Load invitations error:', error)
      // Don't show error for invitations as it's secondary data
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteEmail.trim()) {
      setError('Email is required')
      return
    }

    try {
      setInviteLoading(true)
      setError('')
      setSuccessMessage('')

      const response = await fetch('/api/organization/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccessMessage(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setInviteRole('association')
      
      // Reload invitations to show the new one
      loadInvitations()
    } catch (error) {
      console.error('Send invitation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      superadmin: 'bg-red-100 text-red-800',
      chef: 'bg-blue-100 text-blue-800',
      association: 'bg-green-100 text-green-800',
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDisplayName = (member: Member) => {
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`
    }
    if (member.firstName) {
      return member.firstName
    }
    if (member.lastName) {
      return member.lastName
    }
    return member.email || 'Unknown User'
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{t('error')}</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{t('success')}</h3>
              <div className="mt-1 text-sm text-green-700">
                <p>{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Form (Only for admins) */}
      {canManageOrganization && (
        <div className="mb-8 bg-card shadow-sm border border-border rounded-lg p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">{t('invite_member')}</h3>
          
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">{t('email_label')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="role">{t('role_label')}</Label>
                <select
                  id="role"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="association">{t('role_association')}</option>
                  <option value="chef">{t('role_chef')}</option>
                  <option value="admin">{t('role_admin')}</option>
                </select>
              </div>
            </div>
            
            <Button type="submit" disabled={inviteLoading}>
              {inviteLoading ? t('sending_invitation') : t('send_invitation')}
            </Button>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">
            {t('members_title')} ({members.length})
          </h3>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-foreground">{t('no_members_title')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('no_members_description')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((member) => (
              <div key={member.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {member.imageUrl ? (
                      <img
                        src={member.imageUrl}
                        alt={getDisplayName(member)}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          {getDisplayName(member).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium text-foreground">
                        {getDisplayName(member)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('member_since', { date: formatDate(member.createdAt) })}
                      </p>
                    </div>
                  </div>
                  
                  <Badge className={getRoleColor(member.role)}>
                    {member.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="mt-8 bg-card shadow-sm border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">
              {t('pending_invitations')} ({invitations.length})
            </h3>
          </div>

          <div className="divide-y divide-border">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      {invitation.emailAddress}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t('invited_on', { date: formatDate(invitation.createdAt) })}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getRoleColor(invitation.role)}>
                      {invitation.role}
                    </Badge>
                    <Badge variant="secondary">
                      {invitation.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}