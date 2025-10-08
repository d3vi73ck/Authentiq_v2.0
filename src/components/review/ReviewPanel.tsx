'use client'

import React, { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CommentSection from './CommentSection'
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

interface ReviewPanelProps {
  submission: Submission
  onDecision?: () => void
}

export default function ReviewPanel({ submission, onDecision }: ReviewPanelProps) {
  const { userId } = useAuth()
  const [showDecisionForm, setShowDecisionForm] = useState(false)
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const canUserReview = useCanReview()

  const isFinalized = ['APPROVED', 'REJECTED'].includes(submission.status)

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      setError('A comment is required to make a decision')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: submission.id,
          decision,
          comment: comment.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit decision')
      }

      // Reset form and notify parent
      setShowDecisionForm(false)
      setComment('')
      setDecision('APPROVE')
      if (onDecision) {
        onDecision()
      }
    } catch (err) {
      console.error('Error submitting decision:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit decision')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      IN_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    
    const statusLabels = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      IN_REVIEW: 'In Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
    }

    return (
      <Badge variant="secondary" className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    )
  }

  return (
    <div className="bg-card shadow-sm border border-border rounded-lg">
      {/* Submission Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {submission.title || `Expense ${submission.type}`}
            </h2>
            <p className="text-sm text-muted-foreground">
              Submitted by {submission.user.email} on {formatDate(submission.createdAt)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(submission.status)}
            <span className="text-lg font-medium text-foreground">
              {formatAmount(submission.amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Submission Details */}
      <div className="px-6 py-4 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Expense Type</h3>
            <p className="mt-1 text-sm text-foreground">{submission.type}</p>
          </div>
          {submission.spentAt && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Expense Date</h3>
              <p className="mt-1 text-sm text-foreground">{formatDate(submission.spentAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Files Section */}
      {submission.files.length > 0 && (
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Attached Documents</h3>
          <div className="space-y-2">
            {submission.files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                    <span className="text-primary text-xs font-medium">
                      {file.kind.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.kind}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.mime}
                    </p>
                  </div>
                </div>
                <a
                  href={`/api/files/${file.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:text-primary/80"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision Section */}
      {canUserReview && !isFinalized && (
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">Make a Decision</h3>
            {!showDecisionForm && (
              <Button
                onClick={() => setShowDecisionForm(true)}
              >
                Make Decision
              </Button>
            )}
          </div>

          {showDecisionForm && (
            <form onSubmit={handleSubmitDecision} className="mt-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">
                  Decision
                </Label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="decision"
                      value="APPROVE"
                      checked={decision === 'APPROVE'}
                      onChange={(e) => setDecision(e.target.value as 'APPROVE' | 'REJECT')}
                      className="focus:ring-primary h-4 w-4 text-primary border-border"
                    />
                    <span className="ml-2 text-sm text-foreground">Approve</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="decision"
                      value="REJECT"
                      checked={decision === 'REJECT'}
                      onChange={(e) => setDecision(e.target.value as 'APPROVE' | 'REJECT')}
                      className="focus:ring-primary h-4 w-4 text-primary border-border"
                    />
                    <span className="ml-2 text-sm text-foreground">Reject</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="comment" className="block text-sm font-medium text-foreground mb-1">
                  Comment (required)
                </Label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-background text-foreground"
                  placeholder="Explain your decision..."
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDecisionForm(false)
                    setError('')
                    setComment('')
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !comment.trim()}
                >
                  {loading ? 'Submitting...' : 'Submit Decision'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Comments Section */}
      <div className="px-6 py-4">
        <CommentSection 
          submissionId={submission.id} 
          readonly={isFinalized || !canUserReview}
        />
      </div>
    </div>
  )
}