'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { expenseTypes } from '@/constants/expenseTypes'

export default function NewSubmissionPage() {
  const router = useRouter()
  const t = useTranslations('Submissions')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    amount: '',
    spentAt: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const submitData = {
        type: formData.type,
        title: formData.title || undefined,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        spentAt: formData.spentAt || undefined
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create expense submission')
      }

      const result = await response.json()
      router.push(`/submissions/${result.submission.id}`)
    } catch (error) {
      console.error('Create submission error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/submissions')
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const selectedExpenseType = expenseTypes[formData.type]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('new_submission_title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('new_submission_description')}
        </p>
      </div>

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
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-card shadow-sm border border-border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expense Type */}
          <div>
            <Label htmlFor="type" className="mb-2">
              Expense Type *
            </Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="">Select an expense type</option>
              {Object.entries(expenseTypes).map(([key, expenseType]) => (
                <option key={key} value={key}>
                  {expenseType.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="mb-2">
              Title (optional)
            </Label>
            <Input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Web development training"
            />
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount" className="mb-2">
              Amount (optional)
            </Label>
            <div className="relative">
              <Input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-muted-foreground">€</span>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="spentAt" className="mb-2">
              Expense Date (optional)
            </Label>
            <Input
              type="date"
              id="spentAt"
              value={formData.spentAt}
              onChange={(e) => handleChange('spentAt', e.target.value)}
            />
          </div>

          {/* Document Requirements */}
          {selectedExpenseType && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Required documents for {selectedExpenseType.label}:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                {selectedExpenseType.required.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {doc.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.type || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Expense'}
            </Button>
          </div>
        </form>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-muted border border-border rounded-md">
        <h3 className="text-sm font-medium text-foreground mb-2">How it works?</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Select the expense type to see required documents</li>
          <li>• After creation, you can upload supporting documents</li>
          <li>• Once all documents are uploaded, you can submit the request</li>
          <li>• AI analysis of documents will be done automatically</li>
        </ul>
      </div>
    </div>
  )
}