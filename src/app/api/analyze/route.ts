import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/libs/DB'
import { fileSchema, submissionSchema } from '@/models/Schema'
import { extractText, isOCRSupported } from '@/services/ocr'
import { analyzeDocument } from '@/services/ai'

/**
 * POST /api/analyze - Analyze a document using OCR and AI
 * 
 * Required body:
 * - fileId: The file ID to analyze
 * - processOCR: Whether to perform OCR (default: true)
 * - processAI: Whether to perform AI analysis (default: true)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication using Clerk
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organization context required' }, { status: 400 })
    }

    const body = await request.json()
    const { fileId, processOCR = true, processAI = true } = body

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Verify file exists and belongs to organization
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
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
    }

    const fileRecord = file[0]
    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const results: any = {}

    // Get file from MinIO storage
    const { minioClient, DEFAULT_BUCKET } = await import('@/libs/minio')
    let fileBuffer: Buffer

    try {
      const stream = await minioClient.getObject(DEFAULT_BUCKET, fileRecord.objectKey)
      fileBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
    } catch (error) {
      console.error('Error retrieving file from MinIO:', error)
      return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 })
    }

    // Perform OCR processing if requested and supported
    if (processOCR && isOCRSupported(fileRecord.mime)) {
      try {
        const ocrResult = await extractText(fileBuffer, fileRecord.mime, fileRecord.objectKey)
        results.ocr = ocrResult

        // Update file record with OCR text if successful
        if (ocrResult.success && ocrResult.text) {
          await db
            .update(fileSchema)
            .set({ ocrText: ocrResult.text })
            .where(eq(fileSchema.id, fileId))
        }
      } catch (error) {
        console.error('OCR processing error:', error)
        results.ocr = {
          success: false,
          error: error instanceof Error ? error.message : 'OCR processing failed'
        }
      }
    }

    // Perform AI analysis if requested
    if (processAI) {
      try {
        const aiResult = await analyzeDocument(fileBuffer, fileRecord.mime, fileRecord.objectKey)
        results.ai = aiResult

        // Update file record with AI data if successful
        if (aiResult.success) {
          await db
            .update(fileSchema)
            .set({ aiData: aiResult.data })
            .where(eq(fileSchema.id, fileId))
        }
      } catch (error) {
        console.error('AI analysis error:', error)
        results.ai = {
          success: false,
          error: error instanceof Error ? error.message : 'AI analysis failed'
        }
      }
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