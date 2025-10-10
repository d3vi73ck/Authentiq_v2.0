'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'
import { useCanReview } from '@/libs/rbac-client'
import ReviewPanel from '@/components/review/ReviewPanel'

interface File {
  id: string
  kind: string
  size: number
  mime: string
  createdAt: string
  aiData?: {
    analysis: {
      amount?: number
      currency?: string
      date?: string
      supplier?: string
      documentType?: string
      confidence?: number
      rawText?: string
    }
    metadata: {
      analyzedBy?: string
      organizationId?: string
      analyzedAt?: string
      confidence?: number
    }
  }
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
  spentAt?: string
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

export default function ReviewDetailPage() {
  const router = useRouter()
  const params = useParams()
  const submissionId = params.id as string
  const { isLoaded, userId } = useAuth()
  const t = useTranslations('Review.detail')
  
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const canUserReview = useCanReview()

  useEffect(() => {
    if (isLoaded) {
      checkPermissions()
    }
  }, [isLoaded, submissionId, canUserReview])

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

    fetchSubmission()
  }

  const fetchSubmission = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/submissions/${submissionId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t('submission_not_found'))
        }
        throw new Error(t('load_error'))
      }
      
      const data = await response.json()
      
      // Check if submission is in reviewable state
      if (!['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED'].includes(data.submission.status)) {
        setError(t('not_available'))
        setLoading(false)
        return
      }
      
      setSubmission(data.submission)
      
      // Auto-update status to IN_REVIEW if it's SUBMITTED
      if (data.submission.status === 'SUBMITTED') {
        await updateSubmissionStatus('IN_REVIEW')
      }
    } catch (err) {
      console.error('Error fetching submission:', err)
      setError(err instanceof Error ? err.message : t('load_error'))
    } finally {
      setLoading(false)
    }
  }

  const updateSubmissionStatus = async (status: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status
        })
      })
      
      if (!response.ok) {
        console.error('Failed to update submission status')
        return
      }
      
      // Refresh submission data to get updated status
      const updatedData = await response.json()
      setSubmission(updatedData.submission)
    } catch (error) {
      console.error('Error updating submission status:', error)
    }
  }

  const handleDecision = () => {
    // Refresh submission data after decision
    fetchSubmission()
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
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/review')}
          >
            ← {t('back_to_list')}
          </Button>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">{t('submission_not_found')}</h3>
            <p className="text-sm text-yellow-700 mt-1">
              {t('submission_not_found_description')}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/review')}
          >
            ← {t('back_to_list')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/review')}
            className="mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('back_to_list')}
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/submissions/${submission.id}`)}
        >
          {t('view_consultation')}
        </Button>
      </div>

      {/* Review Panel */}
      <ReviewPanel 
        submission={submission} 
        onDecision={handleDecision}
      />
    </div>
  )
}