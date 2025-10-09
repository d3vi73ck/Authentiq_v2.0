'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'

interface UploadedFile {
  id: string
  kind: string
  objectKey: string
  size: number
  mime: string
  createdAt: string
}

interface FileDropProps {
  submissionId: string
  onFileUploaded: (file: UploadedFile) => void
  onUploadError: (error: string) => void
  disabled?: boolean
  acceptedFileTypes?: string[]
  maxFileSize?: number
}

export default function FileDrop({
  submissionId,
  onFileUploaded,
  onUploadError,
  disabled = false,
  acceptedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  maxFileSize = 10 * 1024 * 1024 // 10MB
}: FileDropProps) {
  const t = useTranslations('Submissions.document_types')
  const [isUploading, setIsUploading] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('')
  const [documentTypeError, setDocumentTypeError] = useState<string>('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || isUploading) return

    // Validate document type selection
    if (!selectedDocumentType) {
      setDocumentTypeError(t('document_type_required'))
      return
    }

    setIsUploading(true)
    setDocumentTypeError('')

    for (const file of acceptedFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('submissionId', submissionId)
        formData.append('kind', selectedDocumentType)
        formData.append('processOCR', 'true') // Enable OCR processing
        formData.append('processAI', 'true') // Enable AI analysis

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const result = await response.json()
        onFileUploaded(result.file)
      } catch (error) {
        console.error('File upload error:', error)
        onUploadError(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    setIsUploading(false)
  }, [submissionId, onFileUploaded, onUploadError, disabled, isUploading, selectedDocumentType, t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || isUploading || !selectedDocumentType,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: maxFileSize,
  })

  const documentTypes = [
    { value: 'FACTURE', label: t('FACTURE') },
    { value: 'CONTRAT', label: t('CONTRAT') },
    { value: 'RECU', label: t('RECU') },
    { value: 'AUTRE', label: t('AUTRE') },
  ]

  return (
    <div className="space-y-4">
      {/* Document Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="document-type" className="text-sm font-medium text-gray-700">
          Document Type *
        </Label>
        <select
          id="document-type"
          value={selectedDocumentType}
          onChange={(e) => {
            setSelectedDocumentType(e.target.value)
            setDocumentTypeError('')
          }}
          disabled={disabled || isUploading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{t('select_document_type')}</option>
          {documentTypes.map((docType) => (
            <option key={docType.value} value={docType.value}>
              {docType.label}
            </option>
          ))}
        </select>
        {documentTypeError && (
          <p className="text-sm text-red-600">{documentTypeError}</p>
        )}
      </div>

      {/* File Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || isUploading || !selectedDocumentType ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-sm text-gray-600">Uploading files...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            
            <p className="text-sm text-gray-600 mb-1">
              {isDragActive ? (
                <span className="text-blue-500">Drop the files here...</span>
              ) : (
                <>
                  <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                </>
              )}
            </p>
            
            <div className="flex flex-wrap gap-1 justify-center mb-2">
              {acceptedFileTypes.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
            
            <p className="text-xs text-gray-500">
              Maximum file size: {maxFileSize / (1024 * 1024)}MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}