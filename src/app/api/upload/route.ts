import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { eq, and } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { db } from '@/libs/DB'
import { submissionSchema, fileSchema } from '@/models/Schema'
import { generateObjectKey, uploadFile } from '@/libs/minio'
import { validateFile, determineFileKind, FileKind } from '@/libs/file-utils'
import { analyzeDocument } from '@/services/ai'

/**
 * POST /api/upload - Upload a file for a submission
 * 
 * Required form data:
 * - file: The file to upload
 * - submissionId: The submission ID
 * - kind: FileKind (optional, will be auto-detected if not provided)
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const submissionId = formData.get('submissionId') as string
    const kind = formData.get('kind') as string
    const processAI = formData.get('processAI') === 'true'

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
    }

    // Verify submission exists and belongs to organization
    const submission = await db
      .select({
        id: submissionSchema.id,
        organizationId: submissionSchema.organizationId,
      })
      .from(submissionSchema)
      .where(
        and(
          eq(submissionSchema.id, submissionId),
          eq(submissionSchema.organizationId, orgId)
        )
      )
      .limit(1)

    if (!submission.length) {
      return NextResponse.json({ error: 'Submission not found or access denied' }, { status: 404 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate file
    const validation = validateFile(buffer, file.name)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Generate object key for MinIO storage
    const objectKey = generateObjectKey(orgId, submissionId, file.name)

    // Upload file to MinIO
    const uploadSuccess = await uploadFile(objectKey, buffer, validation.mimeType!)
    if (!uploadSuccess) {
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Determine file kind (use provided kind or auto-detect)
    const fileKind = kind && Object.values(FileKind).includes(kind as FileKind) 
      ? (kind as FileKind)
      : determineFileKind(validation.mimeType!)

    // Generate unique ID for file using CUID2
    const fileId = createId()
    
    // Create file record in database using Drizzle
    const [fileRecord] = await db
      .insert(fileSchema)
      .values({
        id: fileId,
        submissionId,
        kind: fileKind,
        objectKey,
        size: buffer.length,
        mime: validation.mimeType!,
      })
      .returning()

    if (!fileRecord) {
      throw new Error('Failed to create file record')
    }

    // Select only the fields we want to return
    const fileResponse = {
      id: fileRecord.id,
      kind: fileRecord.kind,
      objectKey: fileRecord.objectKey,
      size: fileRecord.size,
      mime: fileRecord.mime,
      createdAt: fileRecord.createdAt,
    }

    // Background processing for AI analysis
    if (processAI) {
      // Process in background without blocking the response
      processBackgroundAnalysis(fileRecord.id, buffer, validation.mimeType!, file.name, processAI)
        .catch(error => console.error('Background processing error:', error))
    }

    return NextResponse.json({
      success: true,
      file: fileResponse,
      processing: {
        ai: processAI
      }
    }, { status: 201 })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upload?submissionId=:id - Get files for a submission
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

    // Get submission ID from query params
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
    }

    // Verify submission exists and belongs to organization
    const submission = await db
      .select({
        id: submissionSchema.id,
      })
      .from(submissionSchema)
      .where(
        and(
          eq(submissionSchema.id, submissionId),
          eq(submissionSchema.organizationId, orgId)
        )
      )
      .limit(1)

    if (!submission.length) {
      return NextResponse.json({ error: 'Submission not found or access denied' }, { status: 404 })
    }

    // Get files for submission using Drizzle
    const files = await db
      .select({
        id: fileSchema.id,
        kind: fileSchema.kind,
        objectKey: fileSchema.objectKey,
        size: fileSchema.size,
        mime: fileSchema.mime,
        createdAt: fileSchema.createdAt,
      })
      .from(fileSchema)
      .where(eq(fileSchema.submissionId, submissionId))
      .orderBy(fileSchema.createdAt)

    return NextResponse.json({ files })

  } catch (error) {
    console.error('Get files error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Process AI analysis in background
 */
async function processBackgroundAnalysis(
  fileId: string,
  fileBuffer: Buffer,
  mimeType: string,
  filename: string,
  processAI: boolean
): Promise<void> {
  try {
    const results: any = {}

    // Perform AI analysis if requested
    if (processAI) {
      try {
        const aiResult = await analyzeDocument(fileBuffer, mimeType, filename)
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

    console.log(`Background processing completed for file ${fileId}:`, results)
    
  } catch (error) {
    console.error('Background processing error:', error)
  }
}