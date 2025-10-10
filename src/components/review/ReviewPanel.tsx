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
      method?: string
      model?: string
      processingTime?: number
      analysisId?: string
    }
    rawResponse?: any
    enhancedAnalysis?: {
      fields: {
        amount?: number
        currency?: string
        date?: string
        supplier?: string
        documentType?: string
        confidence?: number
        rawText?: string
      }
      commentary?: {
        observations?: string[]
        confidenceAssessment?: string
        potentialIssues?: string[]
        recommendations?: string[]
        overallAssessment?: string
      }
      fieldConfidences?: {
        amount?: number
        currency?: number
        date?: number
        supplier?: number
        documentType?: number
      }
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
  const [analyzingFiles, setAnalyzingFiles] = useState<Set<string>>(new Set())
  const [analysisErrors, setAnalysisErrors] = useState<Record<string, string>>({})
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

  const handleAnalyzeWithAI = async (fileId: string) => {
    console.log(`[ReviewPanel] Starting AI analysis for file: ${fileId}`)
    setAnalyzingFiles(prev => new Set(prev).add(fileId))
    setAnalysisErrors(prev => ({ ...prev, [fileId]: '' }))

    try {
      console.log(`[ReviewPanel] Sending analyze request for file: ${fileId}`)
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          processOCR: true,
          processAI: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`[ReviewPanel] AI analysis failed for file ${fileId}:`, errorData)
        throw new Error(errorData.error || 'AI analysis failed')
      }

      const result = await response.json()
      console.log(`[ReviewPanel] AI analysis completed for file ${fileId}:`, result)
      
      // Refresh the page to show updated AI data
      if (onDecision) {
        console.log(`[ReviewPanel] Triggering page refresh for file ${fileId}`)
        onDecision()
      }
    } catch (err) {
      console.error(`[ReviewPanel] AI analysis error for file ${fileId}:`, err)
      setAnalysisErrors(prev => ({
        ...prev,
        [fileId]: err instanceof Error ? err.message : 'AI analysis failed'
      }))
    } finally {
      setAnalyzingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        console.log(`[ReviewPanel] Analysis completed for file ${fileId}, removing from analyzing set`)
        return newSet
      })
    }
  }

  const isAnalyzing = (fileId: string) => analyzingFiles.has(fileId)

  // Helper function to safely access AI data with fallbacks
  const getAIData = (file: File) => {
    if (!file.aiData) return null
    
    // Handle both old and new AI data structures
    const analysis = file.aiData.analysis || file.aiData
    const metadata = file.aiData.metadata || {}
    const enhancedAnalysis = file.aiData.enhancedAnalysis
    
    return {
      analysis: {
        amount: analysis?.amount,
        currency: analysis?.currency,
        date: analysis?.date,
        supplier: analysis?.supplier,
        documentType: analysis?.documentType,
        confidence: analysis?.confidence,
        rawText: analysis?.rawText
      },
      metadata: {
        analyzedBy: metadata?.analyzedBy,
        organizationId: metadata?.organizationId,
        analyzedAt: metadata?.analyzedAt,
        confidence: metadata?.confidence,
        method: metadata?.method,
        model: metadata?.model,
        processingTime: metadata?.processingTime,
        analysisId: metadata?.analysisId
      },
      enhancedAnalysis: enhancedAnalysis ? {
        fields: enhancedAnalysis.fields || analysis,
        commentary: enhancedAnalysis.commentary,
        fieldConfidences: enhancedAnalysis.fieldConfidences
      } : undefined,
      rawResponse: file.aiData.rawResponse
    }
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
              Submitted by {submission.user?.email || 'Unknown User'} on {formatDate(submission.createdAt)}
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

      {/* Files Section with AI Analysis */}
      {submission.files.length > 0 && (
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Attached Documents</h3>
          <div className="space-y-4">
            {submission.files.map((file) => (
              <div key={file.id} className="border border-border rounded-lg overflow-hidden">
                {/* File Header */}
                <div className="flex items-center justify-between p-3 bg-muted">
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
                
                {/* AI Analysis Results */}
                {(() => {
                  const aiData = getAIData(file)
                  if (!aiData) return null
                  
                  return (
                    <div className="p-3 bg-blue-50 border-t border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-800">AI Analysis</h4>
                        <div className="flex items-center space-x-2">
                          {aiData.metadata.model && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                              {aiData.metadata.model}
                            </Badge>
                          )}
                          {(aiData.metadata.confidence || aiData.analysis.confidence) && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                              Confidence: {Math.round((aiData.metadata.confidence || aiData.analysis.confidence || 0) * 100)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Enhanced Analysis with Field Confidences */}
                      {aiData.enhancedAnalysis && (
                        <div className="mb-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {aiData.enhancedAnalysis.fields.documentType && (
                              <div>
                                <span className="text-blue-700 font-medium">Document Type:</span>
                                <span className="ml-1 text-blue-900">
                                  {aiData.enhancedAnalysis.fields.documentType}
                                  {aiData.enhancedAnalysis.fieldConfidences?.documentType && (
                                    <span className="text-xs text-blue-600 ml-1">
                                      ({Math.round(aiData.enhancedAnalysis.fieldConfidences.documentType * 100)}%)
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            {aiData.enhancedAnalysis.fields.amount && (
                              <div>
                                <span className="text-blue-700 font-medium">Amount:</span>
                                <span className="ml-1 text-blue-900">
                                  {aiData.enhancedAnalysis.fields.amount} {aiData.enhancedAnalysis.fields.currency || 'EUR'}
                                  {aiData.enhancedAnalysis.fieldConfidences?.amount && (
                                    <span className="text-xs text-blue-600 ml-1">
                                      ({Math.round(aiData.enhancedAnalysis.fieldConfidences.amount * 100)}%)
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            {aiData.enhancedAnalysis.fields.date && (
                              <div>
                                <span className="text-blue-700 font-medium">Date:</span>
                                <span className="ml-1 text-blue-900">
                                  {aiData.enhancedAnalysis.fields.date}
                                  {aiData.enhancedAnalysis.fieldConfidences?.date && (
                                    <span className="text-xs text-blue-600 ml-1">
                                      ({Math.round(aiData.enhancedAnalysis.fieldConfidences.date * 100)}%)
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            {aiData.enhancedAnalysis.fields.supplier && (
                              <div>
                                <span className="text-blue-700 font-medium">Supplier:</span>
                                <span className="ml-1 text-blue-900">
                                  {aiData.enhancedAnalysis.fields.supplier}
                                  {aiData.enhancedAnalysis.fieldConfidences?.supplier && (
                                    <span className="text-xs text-blue-600 ml-1">
                                      ({Math.round(aiData.enhancedAnalysis.fieldConfidences.supplier * 100)}%)
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* AI Commentary */}
                          {aiData.enhancedAnalysis.commentary && (
                            <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-200">
                              <h5 className="text-xs font-medium text-blue-800 mb-1">AI Commentary</h5>
                              {aiData.enhancedAnalysis.commentary.overallAssessment && (
                                <p className="text-xs text-blue-700 mb-2">
                                  <strong>Overall:</strong> {aiData.enhancedAnalysis.commentary.overallAssessment}
                                </p>
                              )}
                              {aiData.enhancedAnalysis.commentary.observations && aiData.enhancedAnalysis.commentary.observations.length > 0 && (
                                <div className="mb-1">
                                  <p className="text-xs text-blue-700 font-medium">Observations:</p>
                                  <ul className="text-xs text-blue-700 list-disc list-inside">
                                    {aiData.enhancedAnalysis.commentary.observations.map((obs, index) => (
                                      <li key={index}>{obs}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {aiData.enhancedAnalysis.commentary.potentialIssues && aiData.enhancedAnalysis.commentary.potentialIssues.length > 0 && (
                                <div className="mb-1">
                                  <p className="text-xs text-blue-700 font-medium">Potential Issues:</p>
                                  <ul className="text-xs text-blue-700 list-disc list-inside">
                                    {aiData.enhancedAnalysis.commentary.potentialIssues.map((issue, index) => (
                                      <li key={index}>{issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {aiData.enhancedAnalysis.commentary.recommendations && aiData.enhancedAnalysis.commentary.recommendations.length > 0 && (
                                <div>
                                  <p className="text-xs text-blue-700 font-medium">Recommendations:</p>
                                  <ul className="text-xs text-blue-700 list-disc list-inside">
                                    {aiData.enhancedAnalysis.commentary.recommendations.map((rec, index) => (
                                      <li key={index}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Fallback to basic analysis if no enhanced data */}
                      {!aiData.enhancedAnalysis && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {aiData.analysis.documentType && (
                            <div>
                              <span className="text-blue-700 font-medium">Document Type:</span>
                              <span className="ml-1 text-blue-900">{aiData.analysis.documentType}</span>
                            </div>
                          )}
                          {aiData.analysis.amount && (
                            <div>
                              <span className="text-blue-700 font-medium">Amount:</span>
                              <span className="ml-1 text-blue-900">
                                {aiData.analysis.amount} {aiData.analysis.currency || 'EUR'}
                              </span>
                            </div>
                          )}
                          {aiData.analysis.date && (
                            <div>
                              <span className="text-blue-700 font-medium">Date:</span>
                              <span className="ml-1 text-blue-900">{aiData.analysis.date}</span>
                            </div>
                          )}
                          {aiData.analysis.supplier && (
                            <div>
                              <span className="text-blue-700 font-medium">Supplier:</span>
                              <span className="ml-1 text-blue-900">{aiData.analysis.supplier}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        {aiData.metadata.analyzedAt && (
                          <p className="text-xs text-blue-600">
                            Analyzed on {formatDate(aiData.metadata.analyzedAt)}
                          </p>
                        )}
                        {aiData.metadata.processingTime && (
                          <p className="text-xs text-blue-600">
                            Processing: {aiData.metadata.processingTime}ms
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })()}
                
                {/* No AI Analysis Message with Manual Trigger */}
                {!file.aiData && (
                  <div className="p-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">No AI analysis available for this document</p>
                        {analysisErrors[file.id] && (
                          <p className="text-sm text-red-600">{analysisErrors[file.id]}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleAnalyzeWithAI(file.id)}
                        disabled={isAnalyzing(file.id)}
                        size="sm"
                        variant="outline"
                      >
                        {isAnalyzing(file.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
                            Analyzing...
                          </>
                        ) : (
                          'Analyze with AI'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
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