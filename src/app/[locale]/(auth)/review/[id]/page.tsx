'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
      setError('You do not have permission to access this page')
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
          throw new Error('Submission not found')
        }
        throw new Error('Error loading submission')
      }
      
      const data = await response.json()
      
      // Check if submission is in reviewable state
      if (!['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED'].includes(data.submission.status)) {
        setError('This submission is not available for review')
        setLoading(false)
        return
      }
      
      setSubmission(data.submission)
    } catch (err) {
      console.error('Error fetching submission:', err)
      setError(err instanceof Error ? err.message : 'Error loading submission')
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = () => {
    // Refresh submission data after decision
    fetchSubmission()
  }

  if (!isLoaded || loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
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
              ← Back to Review List
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Submission not found</h3>
              <p className="text-sm text-yellow-700 mt-1">
                The requested submission could not be loaded.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/review')}
            >
              ← Back to Review List
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
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
              Back to Review List
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Submission Review</h1>
            <p className="mt-1 text-muted-foreground">
              Review submission details and make a decision
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/submissions/${submission.id}`)}
          >
            View in Consultation Mode
          </Button>
        </div>
      </div>

      {/* Review Panel */}
      <ReviewPanel 
        submission={submission} 
        onDecision={handleDecision}
      />
    </div>
  )
}