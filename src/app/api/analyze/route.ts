import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/libs/DB'
import { fileSchema, submissionSchema } from '@/models/Schema'
import { analyzeDocument } from '@/services/ai'
import { logger } from '@/libs/Logger'

/**
 * POST /api/analyze - Analyze a document using AI
 *
 * Required body:
 * - fileId: The file ID to analyze
 * - processAI: Whether to perform AI analysis (default: true)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `analyze-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.info({ requestId, action: 'analyze_start' }, 'Starting document analysis request')
    
    // Check authentication using Clerk
    const { userId, orgId } = await auth()
    logger.debug({ requestId, userId, orgId }, 'Authentication check completed')
    
    if (!userId) {
      logger.warn({ requestId }, 'Authentication failed - no user ID')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!orgId) {
      logger.warn({ requestId, userId }, 'Organization context missing')
      return NextResponse.json({ error: 'Organization context required' }, { status: 400 })
    }

    const body = await request.json()
    const { fileId, processAI = true } = body

    logger.info({ requestId, fileId, processAI, userId, orgId }, 'Analysis request parameters')

    if (!fileId) {
      logger.warn({ requestId }, 'File ID missing from request')
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Verify file exists and belongs to organization
    logger.debug({ requestId, fileId }, 'Querying database for file record')
    const file = await db
      .select({
        id: fileSchema.id,
        submissionId: fileSchema.submissionId,
        objectKey: fileSchema.objectKey,
        mime: fileSchema.mime,
        size: fileSchema.size,
        ocrText: fileSchema.ocrText,
        aiData: fileSchema.aiData,
      })
      .from(fileSchema)
      .innerJoin(
        submissionSchema,
        eq(fileSchema.submissionId, submissionSchema.id)
      )
      .where(
        and(
          eq(fileSchema.id, fileId),
          eq(submissionSchema.organizationId, orgId)
        )
      )
      .limit(1)

    if (!file.length) {
      logger.warn({ requestId, fileId, orgId }, 'File not found or access denied')
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
    }

    const fileRecord = file[0]
    if (!fileRecord) {
      logger.warn({ requestId, fileId }, 'File record is empty')
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    logger.info({ requestId, fileId, objectKey: fileRecord.objectKey, mimeType: fileRecord.mime, fileSize: fileRecord.size }, 'File record retrieved successfully')

    const results: any = {}

    // Get file from MinIO storage
    logger.debug({ requestId, objectKey: fileRecord.objectKey }, 'Retrieving file from MinIO storage')
    const { minioClient, DEFAULT_BUCKET } = await import('@/libs/minio')
    let fileBuffer: Buffer

    try {
      const stream = await minioClient.getObject(DEFAULT_BUCKET, fileRecord.objectKey)
      fileBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        let totalSize = 0
        
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
          totalSize += chunk.length
        })
        
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks)
          logger.debug({ requestId, fileSize: buffer.length, chunks: chunks.length, totalSize }, 'File retrieved successfully from MinIO')
          resolve(buffer)
        })
        
        stream.on('error', (error) => {
          logger.error({ requestId, error: error.message }, 'Error retrieving file from MinIO')
          reject(error)
        })
      })
    } catch (error) {
      logger.error({ requestId, error: error instanceof Error ? error.message : 'Unknown error', objectKey: fileRecord.objectKey }, 'Failed to retrieve file from MinIO')
      return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 })
    }

    // Perform AI analysis if requested
    if (processAI) {
      logger.debug({ requestId }, 'Starting AI analysis')
      try {
        const aiResult = await analyzeDocument(fileBuffer, fileRecord.mime, fileRecord.objectKey, userId, orgId)
        results.ai = aiResult

        logger.info({ requestId, success: aiResult.success, method: aiResult.method, confidence: aiResult.data?.confidence, processingTime: aiResult.processingTime }, 'AI analysis completed')

        // Update file record with AI data if successful
        if (aiResult.success) {
          logger.debug({ requestId }, 'Updating file record with AI data')
          await db
            .update(fileSchema)
            .set({ aiData: aiResult.data })
            .where(eq(fileSchema.id, fileId))
          logger.debug({ requestId }, 'File record updated with AI data')
        } else {
          logger.warn({ requestId, error: aiResult.error }, 'AI analysis failed, not updating database')
        }
      } catch (error) {
        logger.error({ requestId, error: error instanceof Error ? error.message : 'Unknown error' }, 'AI analysis failed with exception')
        results.ai = {
          success: false,
          error: error instanceof Error ? error.message : 'AI analysis failed'
        }
      }
    } else {
      logger.debug({ requestId }, 'AI analysis skipped')
    }

    return NextResponse.json({
      success: true,
      fileId,
      results,
    })

  } catch (error) {
    console.error('Document analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/analyze?fileId=:id - Get analysis results for a file
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication using Clerk
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organization context required' }, { status: 400 })
    }

    // Get file ID from query params
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Get file with analysis data
    const file = await db
      .select({
        id: fileSchema.id,
        submissionId: fileSchema.submissionId,
        objectKey: fileSchema.objectKey,
        mime: fileSchema.mime,
        size: fileSchema.size,
        ocrText: fileSchema.ocrText,
        aiData: fileSchema.aiData,
        createdAt: fileSchema.createdAt,
      })
      .from(fileSchema)
      .innerJoin(
        submissionSchema,
        eq(fileSchema.submissionId, submissionSchema.id)
      )
      .where(
        and(
          eq(fileSchema.id, fileId),
          eq(submissionSchema.organizationId, orgId)
        )
      )
      .limit(1)

    if (!file.length) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
    }

    const fileRecord = file[0]
    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        submissionId: fileRecord.submissionId,
        objectKey: fileRecord.objectKey,
        mime: fileRecord.mime,
        size: fileRecord.size,
        ocrText: fileRecord.ocrText,
        aiData: fileRecord.aiData,
        createdAt: fileRecord.createdAt,
      }
    })

  } catch (error) {
    console.error('Get analysis results error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}