import { db } from './DB'
import { fileSchema } from '@/models/Schema'
import { minioClient } from './minio'
import { eq } from 'drizzle-orm'

// FileKind enum values from Schema
export enum FileKind {
  FACTURE = 'FACTURE',
  CONTRAT = 'CONTRAT',
  RECU = 'RECU',
  AUTRE = 'AUTRE'
}

// Supported file types and their MIME types
export const SUPPORTED_FILE_TYPES: Record<string, readonly string[]> = {
  // Document types
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  
  // Image types
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
  
  // Spreadsheet types
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  
  // Text files
  'text/plain': ['txt'],
  'text/csv': ['csv'],
} as const

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

/**
 * Validates file type based on MIME type
 * @param mimeType - The MIME type to validate
 * @returns boolean indicating if the file type is supported
 */
export function validateFileType(mimeType: string): boolean {
  return Object.keys(SUPPORTED_FILE_TYPES).includes(mimeType)
}

/**
 * Validates file size
 * @param size - The file size in bytes
 * @returns boolean indicating if the file size is acceptable
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE
}

/**
 * Gets file extension from filename
 * @param filename - The filename
 * @returns The file extension in lowercase
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Gets MIME type from filename
 * @param filename - The filename
 * @returns The MIME type or null if not supported
 */
export function getMimeTypeFromFilename(filename: string): string | null {
  const extension = getFileExtension(filename)
  
  for (const [mimeType, extensions] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (extensions.includes(extension)) {
      return mimeType
    }
  }
  
  return null
}

/**
 * Validates file based on buffer and filename
 * @param buffer - The file buffer
 * @param filename - The original filename
 * @returns Object with validation result and MIME type
 */
export function validateFile(buffer: Buffer, filename: string): {
  isValid: boolean
  mimeType: string | null
  error?: string
} {
  // Check file size
  if (!validateFileSize(buffer.length)) {
    return {
      isValid: false,
      mimeType: null,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  // Get MIME type from filename
  const mimeType = getMimeTypeFromFilename(filename)
  
  if (!mimeType) {
    return {
      isValid: false,
      mimeType: null,
      error: 'File type not supported',
    }
  }

  // Validate MIME type
  if (!validateFileType(mimeType)) {
    return {
      isValid: false,
      mimeType: null,
      error: 'File type not supported',
    }
  }

  return {
    isValid: true,
    mimeType,
  }
}

/**
 * Determines file kind based on MIME type
 * @param mimeType - The MIME type
 * @returns FileKind enum value
 */
export function determineFileKind(mimeType: string): FileKind {
  if (mimeType.startsWith('image/')) {
    return FileKind.AUTRE // Images are typically receipts or other documents
  }
  
  if (mimeType === 'application/pdf') {
    return FileKind.FACTURE // PDFs are often invoices
  }
  
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return FileKind.CONTRAT // Spreadsheets might be contracts
  }
  
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return FileKind.CONTRAT // Word documents might be contracts
  }
  
  return FileKind.AUTRE // Default to other
}

/**
 * Sanitizes filename by removing special characters
 * @param filename - The original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components and special characters
  const baseName = filename.replace(/^.*[\\\/]/, '') // Remove path
  return baseName.replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
}

/**
 * Generates a safe filename with timestamp
 * @param originalFilename - The original filename
 * @returns Safe filename with timestamp
 */
export function generateSafeFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const extension = getFileExtension(originalFilename)
  const baseName = sanitizeFilename(originalFilename.replace(`.${extension}`, ''))
  
  return `${baseName}_${timestamp}.${extension}`
}

/**
 * Gets human-readable file size
 * @param bytes - File size in bytes
 * @returns Human-readable file size string
 */
export function getHumanReadableFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  
  if (bytes === 0) return '0 Bytes'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Checks if file is an image based on MIME type
 * @param mimeType - The MIME type
 * @returns boolean indicating if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Checks if file is a PDF based on MIME type
 * @param mimeType - The MIME type
 * @returns boolean indicating if file is a PDF
 */
export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

/**
 * Checks if file is a document (Word, Excel, etc.) based on MIME type
 * @param mimeType - The MIME type
 * @returns boolean indicating if file is a document
 */
export function isDocumentFile(mimeType: string): boolean {
  return mimeType.includes('word') ||
         mimeType.includes('excel') ||
         mimeType.includes('spreadsheet') ||
         mimeType.includes('document')
}

/**
 * File cleanup utilities for managing file lifecycle
 */

/**
 * Deletes all files for a submission
 * @param submissionId - The submission ID
 * @returns Promise resolving to cleanup result
 */
export async function cleanupSubmissionFiles(submissionId: string): Promise<{
  success: boolean
  deletedCount: number
  errors: string[]
}> {
  const errors: string[] = []
  let deletedCount = 0

  try {
    // Get all files for the submission using Drizzle
    const files = await db
      .select({
        id: fileSchema.id,
        objectKey: fileSchema.objectKey,
      })
      .from(fileSchema)
      .where(eq(fileSchema.submissionId, submissionId))

    // Delete each file from MinIO and database
    for (const file of files) {
      try {
        // Delete from MinIO
        const minioSuccess = await minioClient.removeObject(
          process.env.MINIO_BUCKET || 'kifndirou',
          file.objectKey
        ).then(() => true).catch(() => false)

        if (minioSuccess) {
          // Delete from database using Drizzle
          await db
            .delete(fileSchema)
            .where(eq(fileSchema.id, file.id))
          deletedCount++
        } else {
          errors.push(`Failed to delete file from storage: ${file.objectKey}`)
        }
      } catch (error) {
        errors.push(`Error deleting file ${file.id}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      deletedCount,
      errors,
    }
  } catch (error) {
    errors.push(`Cleanup failed: ${error}`)
    return {
      success: false,
      deletedCount,
      errors,
    }
  }
}

/**
 * Validates if a file can be previewed in browser
 * @param mimeType - The MIME type
 * @returns boolean indicating if file can be previewed
 */
export function canPreviewInBrowser(mimeType: string): boolean {
  return isImageFile(mimeType) || isPdfFile(mimeType) || mimeType === 'text/plain'
}

/**
 * Gets appropriate icon for file type
 * @param mimeType - The MIME type
 * @returns Icon name or type identifier
 */
export function getFileIcon(mimeType: string): string {
  if (isImageFile(mimeType)) return 'image'
  if (isPdfFile(mimeType)) return 'pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet'
  if (mimeType === 'text/plain') return 'text'
  if (mimeType === 'text/csv') return 'csv'
  return 'file'
}