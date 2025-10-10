/**
 * AI Service for Document Processing
 * Uses OpenAI API for document analysis and expense data extraction
 */

import { logger } from '@/libs/Logger'


// Timeout configuration for OpenAI API calls (30 seconds)
const OPENAI_TIMEOUT_MS = 30000;


// Types for document analysis results
export interface ExpenseData {
  amount: number | null;
  currency: string | null;
  date: string | null;
  supplier: string | null;
  documentType: string | null;
  confidence: number;
  rawText?: string;
}

export interface AnalysisMetadata {
  analyzedBy: string;
  organizationId: string;
  analyzedAt: string;
  confidence: number;
  model?: string;
  processingTime?: number;
  analysisId?: string;
}

export interface AICommentary {
  observations: string[];
  confidenceAssessment: string;
  potentialIssues: string[];
  recommendations: string[];
  overallAssessment: string;
}

export interface EnhancedExpenseData {
  fields: ExpenseData;
  commentary: AICommentary;
  fieldConfidences: {
    amount: number;
    currency: number;
    date: number;
    supplier: number;
    documentType: number;
  };
}

export interface DocumentAnalysisResult {
  success: boolean;
  data: ExpenseData;
  metadata: AnalysisMetadata;
  error?: string;
  processingTime?: number;
  rawResponse?: any; // Complete OpenAI API response
  enhancedAnalysis?: EnhancedExpenseData; // Enhanced analysis with commentary
}

export interface AIDataStorage {
  analysis: ExpenseData;
  metadata: AnalysisMetadata;
  rawResponse?: any;
  enhancedAnalysis?: EnhancedExpenseData;
}

/**
 * Analyzes a document using OpenAI API for expense data extraction
 * @param fileBuffer - The file buffer to analyze
 * @param mimeType - The MIME type of the file
 * @param filename - The original filename
 * @param userId - The user ID who triggered the analysis
 * @param organizationId - The organization ID
 * @returns Promise resolving to document analysis result
 */
export async function analyzeDocument(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string,
  userId?: string,
  organizationId?: string
): Promise<DocumentAnalysisResult> {
  const startTime = Date.now();
  const analysisId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info({ analysisId, filename, mimeType, fileSize: fileBuffer.length, userId, organizationId }, 'Starting document analysis');
  
  try {
    // Check if OpenAI API is available
    const openAIAvailable = !!process.env.OPENAI_API_KEY;
    logger.debug({ analysisId, openAIAvailable, hasApiKey: !!process.env.OPENAI_API_KEY }, 'Checking OpenAI API availability');
    
    if (!openAIAvailable) {
      logger.warn({ analysisId }, 'OpenAI API key not available');
      const processingTime = Date.now() - startTime;
      
      const metadata: AnalysisMetadata = {
        analyzedBy: userId || 'system',
        organizationId: organizationId || 'unknown',
        analyzedAt: new Date().toISOString(),
        confidence: 0
      };
      
      return {
        success: false,
        data: {
          amount: null,
          currency: null,
          date: null,
          supplier: null,
          documentType: null,
          confidence: 0
        },
        metadata,
        error: 'OpenAI API key not configured',
        processingTime
      };
    }

    // Use OpenAI API exclusively
    logger.info({ analysisId }, 'Attempting OpenAI analysis');

    // ATI : before analyzing with open ai , check the mimeType 
    // if it is a PDF , then return
    if (mimeType === 'application/pdf') {
      logger.info({ analysisId }, 'PDF detected, returning early');
      return {
        success: false,
        data: {
          amount: null,
          currency: null,
          date: null,
          supplier: null,
          documentType: null,
          confidence: 0
        },
        metadata: {
          analyzedBy: userId || 'system',
          organizationId: organizationId || 'unknown',
          analyzedAt: new Date().toISOString(),
          confidence: 0
        },
        error: 'PDF files are not supported',
        processingTime: Date.now() - startTime
      };
    }

    const aiResult = await analyzeWithOpenAI(fileBuffer, mimeType, filename, analysisId);
    
    if (aiResult.success) {
      const metadata: AnalysisMetadata = {
        analyzedBy: userId || 'system',
        organizationId: organizationId || 'unknown',
        analyzedAt: new Date().toISOString(),
        confidence: aiResult.data.confidence
      };
      
      const processingTime = Date.now() - startTime;
      logger.info({ analysisId, success: true, confidence: aiResult.data.confidence, processingTime }, 'OpenAI analysis completed successfully');
      
      return {
        ...aiResult,
        metadata,
        processingTime
      };
    } else {
      const processingTime = Date.now() - startTime;
      logger.warn({ analysisId, error: aiResult.error }, 'OpenAI analysis failed');
      
      const metadata: AnalysisMetadata = {
        analyzedBy: userId || 'system',
        organizationId: organizationId || 'unknown',
        analyzedAt: new Date().toISOString(),
        confidence: 0
      };
      
      return {
        success: false,
        data: {
          amount: null,
          currency: null,
          date: null,
          supplier: null,
          documentType: null,
          confidence: 0
        },
        metadata,
        error: aiResult.error || 'OpenAI analysis failed',
        processingTime
      };
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error({ analysisId, error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined, processingTime }, 'Document analysis failed with exception');
    
    const metadata: AnalysisMetadata = {
      analyzedBy: userId || 'system',
      organizationId: organizationId || 'unknown',
      analyzedAt: new Date().toISOString(),
      confidence: 0
    };
    
    return {
      success: false,
      data: {
        amount: null,
        currency: null,
        date: null,
        supplier: null,
        documentType: null,
        confidence: 0
      },
      metadata,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      processingTime
    };
  }
}


/**
 * Analyzes document using OpenAI Vision API
 * @param fileBuffer - The file buffer
 * @param mimeType - The MIME type
 * @param filename - The filename
 * @returns Promise resolving to analysis result
 */
async function analyzeWithOpenAI(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string,
  analysisId?: string
): Promise<DocumentAnalysisResult> {
  const openAIStartTime = Date.now();
  
  try {
    logger.debug({ analysisId, filename, mimeType, fileSize: fileBuffer.length }, 'Starting OpenAI analysis');
    
    // Validate file type - OpenAI Vision API supports specific image types and PDF
    // OpenAI Vision API supports: JPEG, JPG, PNG, GIF, WebP images and PDF documents
    const supportedFileTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ];
    
    const isSupported = supportedFileTypes.includes(mimeType.toLowerCase());
    
    if (!isSupported) {
      const supportedTypesList = supportedFileTypes.join(', ');
      logger.warn({ analysisId, mimeType, supportedTypes: supportedTypesList }, 'Unsupported file type for OpenAI Vision API');
      throw new Error(`Unsupported file type: ${mimeType}. OpenAI Vision API supports: ${supportedTypesList}`);
    }
    
    let processedBuffer = fileBuffer;
    let processedMimeType = mimeType;
    
    // Convert buffer to base64 for OpenAI Vision API
    const base64Image = processedBuffer.toString('base64');
    const base64Size = base64Image.length;
    
    logger.debug({ analysisId, base64Size, isSupported, processedMimeType }, 'Converted file to base64 for OpenAI');
    
    // Check if base64 data is too large (OpenAI has limits)
    const maxBase64Size = 20 * 1024 * 1024; // 20MB limit for base64 encoded images
    if (base64Size > maxBase64Size) {
      logger.warn({ analysisId, base64Size, maxBase64Size }, 'Base64 data exceeds size limit, using low detail mode');
    }

    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert document analyzer for expense justification.
          Analyze the document and provide comprehensive extraction and commentary.

          **STRUCTURED DATA EXTRACTION:**
          Extract the following information from the document:
          - Total amount (numeric value)
          - Currency (EUR, USD, etc.)
          - Date (YYYY-MM-DD format if possible)
          - Supplier name
          - Document type (invoice, receipt, contract, etc.)
          
          **AI COMMENTARY:**
          Provide detailed commentary including:
          - Key observations about the document quality and content
          - Confidence assessment for each extracted field
          - Potential issues or inconsistencies found
          - Recommendations for manual review if needed
          - Overall assessment of the document analysis
          
          **RESPONSE FORMAT:**
          Return a JSON object with the following structure:
          {
            "extraction": {
              "amount": number | null,
              "currency": string | null,
              "date": string | null,
              "supplier": string | null,
              "documentType": string | null,
              "confidence": number (0-1),
              "rawText": string (if applicable)
            },
            "commentary": {
              "observations": string[],
              "confidenceAssessment": string,
              "potentialIssues": string[],
              "recommendations": string[],
              "overallAssessment": string
            },
            "fieldConfidences": {
              "amount": number (0-1),
              "currency": number (0-1),
              "date": number (0-1),
              "supplier": number (0-1),
              "documentType": number (0-1)
            }
          }
          
          Support both English and French documents.
          If you cannot extract certain information, set it to null.
          Focus on finding the total amount, date, and supplier name.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this document (${filename}) and extract expense information with comprehensive commentary.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${processedMimeType};base64,${base64Image}`,
                detail: base64Size > maxBase64Size ? 'low' : 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    };

    logger.debug({ analysisId, endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o', timeout: OPENAI_TIMEOUT_MS, base64Size, detail: base64Size > maxBase64Size ? 'low' : 'high' }, 'Making OpenAI API request with timeout');
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const responseTime = Date.now() - openAIStartTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorDetails = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = JSON.stringify(errorJson, null, 2);
        } catch {
          // Keep original error text if not JSON
        }
        logger.error({ analysisId, status: response.status, statusText: response.statusText, responseTime, errorDetails, requestBody: JSON.stringify(requestBody).substring(0, 1000) }, 'OpenAI API returned error response');
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorDetails}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        logger.error({ analysisId, data }, 'No content received from OpenAI response');
        throw new Error('No content received from OpenAI');
      }

      logger.debug({ analysisId, contentLength: content.length, responseTime }, 'Received OpenAI response');
      
      const parsedData = JSON.parse(content);
      
      // Handle both old and new response formats for backward compatibility
      let extractionData = parsedData;
      let enhancedAnalysis: EnhancedExpenseData | undefined;
      
      if (parsedData.extraction) {
        // New format with enhanced data
        extractionData = parsedData.extraction;
        
        enhancedAnalysis = {
          fields: {
            amount: parseFloat(extractionData.amount) || null,
            currency: extractionData.currency || null,
            date: extractionData.date || null,
            supplier: extractionData.supplier || null,
            documentType: extractionData.documentType || null,
            confidence: Math.min(Math.max(extractionData.confidence || 0.5, 0), 1),
            rawText: extractionData.rawText
          },
          commentary: parsedData.commentary || {
            observations: [],
            confidenceAssessment: 'No commentary available',
            potentialIssues: [],
            recommendations: [],
            overallAssessment: 'No assessment available'
          },
          fieldConfidences: parsedData.fieldConfidences || {
            amount: extractionData.confidence || 0.5,
            currency: extractionData.confidence || 0.5,
            date: extractionData.confidence || 0.5,
            supplier: extractionData.confidence || 0.5,
            documentType: extractionData.confidence || 0.5
          }
        };
      }
      
      const confidence = Math.min(Math.max(extractionData.confidence || 0.5, 0), 1);
      
      const result: DocumentAnalysisResult = {
        success: true,
        data: {
          amount: parseFloat(extractionData.amount) || null,
          currency: extractionData.currency || null,
          date: extractionData.date || null,
          supplier: extractionData.supplier || null,
          documentType: extractionData.documentType || null,
          confidence,
          rawText: extractionData.rawText
        },
        metadata: {
          analyzedBy: 'system',
          organizationId: 'unknown',
          analyzedAt: new Date().toISOString(),
          confidence,
          model: 'gpt-4o',
          processingTime: responseTime,
          analysisId
        },
        rawResponse: data, // Store complete OpenAI response
        enhancedAnalysis
      };

      logger.debug({ analysisId, parsedData, confidence, hasEnhancedAnalysis: !!enhancedAnalysis }, 'Successfully parsed OpenAI response');
      
      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - openAIStartTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error({ analysisId, responseTime, timeout: OPENAI_TIMEOUT_MS }, 'OpenAI API request timed out');
        throw new Error(`OpenAI API request timed out after ${OPENAI_TIMEOUT_MS}ms`);
      }
      
      logger.error({ analysisId, error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined, responseTime }, 'OpenAI analysis failed');
      throw error;
    }
  } catch (error) {
    const responseTime = Date.now() - openAIStartTime;
    logger.error({ analysisId, error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined, responseTime }, 'OpenAI analysis failed completely');
    throw error;
  }
}

/**
 * Validates if OpenAI API is configured
 * @returns boolean indicating if OpenAI API is available
 */
export function isOpenAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Gets supported languages for document analysis
 * @returns Array of supported language codes
 */
export function getSupportedLanguages(): string[] {
  return ['en', 'fr']; // English and French
}

/**
 * Processes multiple documents in batch
 * @param documents - Array of documents to process
 * @param userId - The user ID who triggered the analysis
 * @param organizationId - The organization ID
 * @returns Promise resolving to array of analysis results
 */
export async function processDocumentsBatch(
  documents: Array<{ buffer: Buffer; mimeType: string; filename: string }>,
  userId?: string,
  organizationId?: string
): Promise<DocumentAnalysisResult[]> {
  const results: DocumentAnalysisResult[] = [];
  
  for (const doc of documents) {
    const result = await analyzeDocument(doc.buffer, doc.mimeType, doc.filename, userId, organizationId);
    results.push(result);
  }
  
  return results;
}

/**
 * Formats analysis result for database storage
 * @param result - The analysis result
 * @returns Formatted data for aiData field
 */
export function formatForStorage(result: DocumentAnalysisResult): AIDataStorage {
  return {
    analysis: result.data,
    metadata: result.metadata,
    rawResponse: result.rawResponse,
    enhancedAnalysis: result.enhancedAnalysis
  };
}