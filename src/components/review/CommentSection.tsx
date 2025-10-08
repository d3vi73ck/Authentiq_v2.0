'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCanReview } from '@/libs/rbac-client'

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

interface CommentSectionProps {
  submissionId: string
  readonly?: boolean
}

export default function CommentSection({ submissionId, readonly = false }: CommentSectionProps) {
  const { userId } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const canUserComment = useCanReview()

  // Fetch comments when component mounts
  useEffect(() => {
    fetchComments()
  }, [submissionId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/review/comments?submissionId=${submissionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      const data = await response.json()
      setComments(data.comments || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
      setError('Failed to load comments')
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/review/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          text: newComment,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add comment')
      }

      const data = await response.json()
      setComments(prev => [data.comment, ...prev])
      setNewComment('')
    } catch (err) {
      console.error('Error adding comment:', err)
      setError(err instanceof Error ? err.message : 'Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDecisionBadge = (decision?: 'APPROVE' | 'REJECT') => {
    if (!decision) return null

    if (decision === 'APPROVE') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          ✓ Approved
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="bg-red-100 text-red-800">
          ✗ Rejected
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">Comments</h3>
      
      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-foreground">
                    {comment.user.email}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {comment.user.role}
                  </Badge>
                  {getDecisionBadge(comment.decision)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-foreground whitespace-pre-wrap">{comment.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      {!readonly && canUserComment && (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-1">
              Add Comment
            </label>
            <textarea
              id="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-background text-foreground"
              placeholder="Write your comment here..."
              disabled={loading}
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || !newComment.trim()}
            >
              {loading ? 'Sending...' : 'Add Comment'}
            </Button>
          </div>
        </form>
      )}

      {!readonly && !canUserComment && (
        <p className="text-sm text-muted-foreground">
          You do not have permission to comment.
        </p>
      )}
    </div>
  )
}