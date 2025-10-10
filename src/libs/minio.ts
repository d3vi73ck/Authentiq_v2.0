import * as Minio from 'minio'
import { logger } from './Logger'

// MinIO configuration from environment variables
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'your-access-key',
  secretKey: process.env.MINIO_SECRET_KEY || 'your-secret-key',
}

// Create MinIO client instance
export const minioClient = new Minio.Client(minioConfig)

// Default bucket name
export const DEFAULT_BUCKET = process.env.MINIO_BUCKET || 'kifndirou'

logger.info({
  endPoint: minioConfig.endPoint,
  port: minioConfig.port,
  useSSL: minioConfig.useSSL,
  bucket: DEFAULT_BUCKET
}, 'MinIO client initialized');

/**
 * Ensures the MinIO bucket exists
 * @param bucketName - The bucket name to ensure exists
 * @returns Promise resolving to boolean indicating success
 */
export async function ensureBucketExists(bucketName: string = DEFAULT_BUCKET): Promise<boolean> {
  const operationId = `minio-bucket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.debug({ operationId, bucketName }, 'Checking if bucket exists')
    const exists = await minioClient.bucketExists(bucketName)
    
    if (!exists) {
      logger.info({ operationId, bucketName }, 'Bucket does not exist, creating new bucket')
      await minioClient.makeBucket(bucketName, 'us-east-1')
      logger.info({ operationId, bucketName }, 'Bucket created successfully')
    } else {
      logger.debug({ operationId, bucketName }, 'Bucket already exists')
    }
    
    return true
  } catch (error) {
    logger.error({ operationId, bucketName, error: error instanceof Error ? error.message : 'Unknown error' }, 'Error ensuring bucket exists')
    return false
  }
}

/**
 * Validates MinIO connection
 * @returns Promise resolving to boolean indicating if connection is valid
 */
export async function validateMinioConnection(): Promise<boolean> {
  const operationId = `minio-validate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.debug({ operationId }, 'Validating MinIO connection')
    await ensureBucketExists()
    logger.info({ operationId }, 'MinIO connection validated successfully')
    return true
  } catch (error) {
    logger.error({ operationId, error: error instanceof Error ? error.message : 'Unknown error' }, 'MinIO connection validation failed')
    return false
  }
}

/**
 * Gets file object URL for download
 * @param objectKey - The object key in MinIO
 * @param bucketName - The bucket name
 * @returns Promise resolving to presigned URL
 */
export async function getFileUrl(objectKey: string, bucketName: string = DEFAULT_BUCKET): Promise<string> {
  const operationId = `minio-url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.debug({ operationId, objectKey, bucketName }, 'Generating presigned file URL')
    const url = await minioClient.presignedGetObject(bucketName, objectKey, 24 * 60 * 60) // 24 hours expiry
    logger.debug({ operationId, objectKey, urlLength: url.length }, 'File URL generated successfully')
    return url
  } catch (error) {
    logger.error({ operationId, objectKey, bucketName, error: error instanceof Error ? error.message : 'Unknown error' }, 'Error generating file URL')
    throw new Error('Failed to generate file URL')
  }
}

/**
 * Deletes a file from MinIO
 * @param objectKey - The object key to delete
 * @param bucketName - The bucket name
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteFile(objectKey: string, bucketName: string = DEFAULT_BUCKET): Promise<boolean> {
  const operationId = `minio-delete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.info({ operationId, objectKey, bucketName }, 'Deleting file from MinIO')
    await minioClient.removeObject(bucketName, objectKey)
    logger.info({ operationId, objectKey }, 'File deleted successfully')
    return true
  } catch (error) {
    logger.error({ operationId, objectKey, bucketName, error: error instanceof Error ? error.message : 'Unknown error' }, 'Error deleting file')
    return false
  }
}

/**
 * Uploads a file to MinIO
 * @param objectKey - The object key (path) in MinIO
 * @param fileBuffer - The file buffer to upload
 * @param contentType - The MIME type of the file
 * @param bucketName - The bucket name
 * @returns Promise resolving to boolean indicating success
 */
export async function uploadFile(
  objectKey: string,
  fileBuffer: Buffer,
  contentType: string,
  bucketName: string = DEFAULT_BUCKET
): Promise<boolean> {
  const operationId = `minio-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.debug({ operationId, objectKey, bucketName, contentType, fileSize: fileBuffer.length }, 'Uploading file to MinIO')
    await ensureBucketExists(bucketName)
    
    await minioClient.putObject(bucketName, objectKey, fileBuffer, fileBuffer.length, {
      'Content-Type': contentType,
    })
    
    logger.info({ operationId, objectKey, fileSize: fileBuffer.length }, 'File uploaded successfully')
    return true
  } catch (error) {
    logger.error({ operationId, objectKey, bucketName, contentType, fileSize: fileBuffer.length, error: error instanceof Error ? error.message : 'Unknown error' }, 'Error uploading file')
    return false
  }
}

/**
 * Generates object key for file storage with organization isolation
 * @param organizationId - The organization ID
 * @param submissionId - The submission ID
 * @param filename - The original filename
 * @returns Generated object key
 */
export function generateObjectKey(organizationId: string, submissionId: string, filename: string): string {
  const timestamp = Date.now()
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `organizations/${organizationId}/submissions/${submissionId}/${timestamp}_${safeFilename}`
}

/**
 * Extracts metadata from object key
 * @param objectKey - The object key
 * @returns Object with extracted metadata or null if invalid format
 */
export function extractMetadataFromObjectKey(objectKey: string): { organizationId: string; submissionId: string; filename: string } | null {
  const match = objectKey.match(/^organizations\/([^\/]+)\/submissions\/([^\/]+)\/(\d+)_(.+)$/)
  
  if (!match || !match[1] || !match[2] || !match[4]) {
    return null
  }
  
  return {
    organizationId: match[1],
    submissionId: match[2],
    filename: match[4],
  }
}