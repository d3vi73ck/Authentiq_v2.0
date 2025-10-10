'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@clerk/nextjs'
import { useCanReview } from '@/libs/rbac-client'

interface File {
  id: string
  kind: string
  size: number
  mime: string
  createdAt: string
}

interface Comment {
  id: string
  text: string
  decision?: 'APPROVE' | 'REJECT'
  createdAt: string
  user: {
    id: string
    email: string
    role: string
  }
}

interface Submission {
  id: string
  type: string
  title?: string
  amount?: number
  status: string
  createdAt: string
  files: File[]
  comments: Comment[]
  user: {
    id: string
    email: string
    role: string
  }
}

interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export default function ReviewPage() {
  const router = useRouter()
  const { isLoaded, userId } = useAuth()
  const t = useTranslations('Review.page')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const canUserReview = useCanReview()
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  })

  useEffect(() => {
    if (isLoaded) {
      checkPermissions()
    }
  }, [isLoaded, canUserReview])

  const checkPermissions = () => {
    if (!userId) {
      router.push('/sign-in')
      return
    }

    if (!canUserReview) {
      setError(t('permission_denied'))
      setLoading(false)
      return
    }

    loadSubmissions()
  }

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/review')
      
      if (!response.ok) {
        throw new Error(t('load_error'))
      }
      
      const data = await response.json()
      setSubmissions(data.submissions)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Load review submissions error:', error)
      setError(t('load_error'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      IN_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getCommentCount = (submission: Submission) => {
    return submission.comments.length
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button onClick={() => router.push('/submissions')}>
          {t('view_my_submissions')}
        </Button>
      </div>

      {/* Submissions List */}
      <div className="bg-card shadow-sm border border-border rounded-lg">
        {submissions.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-foreground">{t('no_submissions_title')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('no_submissions_description')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="p-6 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-foreground truncate">
                        {submission.title || `Expense ${submission.type}`}
                      </h3>
                      <Badge variant="secondary" className={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('submitted_by', { email: submission.user.email, date: formatDate(submission.createdAt) })}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{t('type', { type: submission.type })}</span>
                      <span>{t('amount', { amount: formatAmount(submission.amount) })}</span>
                      <span>{t('files', { count: submission.files.length })}</span>
                      <span>{t('comments', { count: getCommentCount(submission) })}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/submissions/${submission.id}`)}
                    >
                      {t('view_details')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/review/${submission.id}`)}
                    >
                      {t('review')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              // TODO: Implement pagination
              console.log('Load more review submissions')
            }}
          >
            {t('load_more')}
          </Button>
        </div>
      )}
    </div>
  )
}