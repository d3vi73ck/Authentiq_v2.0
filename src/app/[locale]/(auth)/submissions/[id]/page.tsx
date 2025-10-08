'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TitleBar } from '@/features/dashboard/TitleBar'

interface File {
  id: string
  kind: string
  objectKey: string
  size: number
  mime: string
  createdAt: string
  aiData?: Record<string, unknown>
}

interface Comment {
  id: string
  userId: string
  text: string
  decision?: string
  createdAt: string
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
}

export default function SubmissionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('Submissions')
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const submissionId = params.id as string

  useEffect(() => {
    loadSubmission()
  }, [submissionId])

  const loadSubmission = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/submissions/${submissionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load submission')
      }
      
      const data = await response.json()
      setSubmission(data.submission)
    } catch (error) {
      console.error('Load submission error:', error)
      setError('Failed to load submission')
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
      month: 'long',
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error || 'Submission not found'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <TitleBar
        title={submission.title || `Expense ${submission.type}`}
        description={
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className={getStatusColor(submission.status)}>
              {submission.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created on {formatDate(submission.createdAt)}
            </span>
          </div>
        }
      />

      {/* Back Navigation */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/submissions')}
          className="text-blue-600 hover:text-blue-900 text-sm p-0 h-auto"
        >
          {t('back_to_submissions')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission Details */}
          <div className="bg-card shadow-sm border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">{t('expense_details')}</h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">{t('expense_type')}</dt>
                <dd className="mt-1 text-sm text-foreground">{submission.type}</dd>
              </div>
              {submission.title && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">{t('title')}</dt>
                  <dd className="mt-1 text-sm text-foreground">{submission.title}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">{t('amount')}</dt>
                <dd className="mt-1 text-sm text-foreground">{formatAmount(submission.amount)}</dd>
              </div>
              {submission.spentAt && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">{t('expense_date')}</dt>
                  <dd className="mt-1 text-sm text-foreground">{formatDate(submission.spentAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Files List */}
          <div className="bg-card shadow-sm border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">
              {t('documents')} ({submission.files.length})
            </h2>
            
            {submission.files.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded</p>
            ) : (
              <div className="space-y-3">
                {submission.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {file.objectKey.split('/').pop()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.kind} • {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </div>
                    {file.aiData && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        AI Analyzed
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          <div className="bg-card shadow-sm border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">{t('actions')}</h3>
            <div className="space-y-3">
              {submission.status === 'DRAFT' && submission.files.length > 0 && (
                <Button
                  onClick={() => {/* TODO: Implement submit action */}}
                  className="w-full"
                >
                  {t('submit_for_review')}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push('/submissions')}
                className="w-full"
              >
                {t('back_to_list')}
              </Button>
            </div>
          </div>

          {/* Comments */}
          {submission.comments.length > 0 && (
            <div className="bg-card shadow-sm border border-border rounded-lg p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">
                {t('comments')} ({submission.comments.length})
              </h3>
              <div className="space-y-4">
                {submission.comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-blue-200 pl-4">
                    <p className="text-sm text-foreground">{comment.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(comment.createdAt)}
                      {comment.decision && (
                        <Badge 
                          variant="secondary" 
                          className={`ml-2 ${
                            comment.decision === 'APPROVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {comment.decision}
                        </Badge>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}