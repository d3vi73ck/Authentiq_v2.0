/**
 * AI Service for Document Processing
 * Uses OpenAI API for document analysis and expense data extraction
 */

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
  method: 'ai' | 'regex';
}

export interface DocumentAnalysisResult {
  success: boolean;
  data: ExpenseData;
  metadata: AnalysisMetadata;
  error?: string;
  processingTime?: number;
  method: 'ai' | 'regex';
}

export interface AIDataStorage {
  analysis: ExpenseData;
  metadata: AnalysisMetadata;
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
  
  try {
    // First try OpenAI API if available
    if (process.env.OPENAI_API_KEY) {
      const aiResult = await analyzeWithOpenAI(fileBuffer, mimeType, filename);
      if (aiResult.success) {
        const metadata: AnalysisMetadata = {
          analyzedBy: userId || 'system',
          organizationId: organizationId || 'unknown',
          analyzedAt: new Date().toISOString(),
          confidence: aiResult.data.confidence,
          method: 'ai'
        };
        
        return {
          ...aiResult,
          metadata,
          processingTime: Date.now() - startTime,
          method: 'ai'
        };
      }
    }

    // Fallback to regex parsing
    const regexResult = await analyzeWithRegex(fileBuffer, mimeType, filename);
    const metadata: AnalysisMetadata = {
      analyzedBy: userId || 'system',
      organizationId: organizationId || 'unknown',
      analyzedAt: new Date().toISOString(),
      confidence: regexResult.data.confidence,
      method: 'regex'
    };
    
    return {
      ...regexResult,
      metadata,
      processingTime: Date.now() - startTime,
      method: 'regex'
    };

  } catch (error) {
    console.error('Document analysis error:', error);
    const metadata: AnalysisMetadata = {
      analyzedBy: userId || 'system',
      organizationId: organizationId || 'unknown',
      analyzedAt: new Date().toISOString(),
      confidence: 0,
      method: 'regex'
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
      processingTime: Date.now() - startTime,
      method: 'regex'
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
  filename: string
): Promise<DocumentAnalysisResult> {
  try {
    // Convert buffer to base64 for OpenAI Vision API
    const base64Image = fileBuffer.toString('base64');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert document analyzer for expense justification. 
            Extract the following information from the document:
            - Total amount (numeric value)
            - Currency (EUR, USD, etc.)
            - Date (YYYY-MM-DD format if possible)
            - Supplier name
            - Document type (invoice, receipt, contract, etc.)
            
            Support both English and French documents.
            Return JSON with the extracted data and a confidence score (0-1).
            
            If you cannot extract certain information, set it to null.
            Focus on finding the total amount, date, and supplier name.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this document (${filename}) and extract expense information.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const parsedData = JSON.parse(content);
    const confidence = Math.min(Math.max(parsedData.confidence || 0.5, 0), 1);
    
    return {
      success: true,
      data: {
        amount: parseFloat(parsedData.amount) || null,
        currency: parsedData.currency || null,
        date: parsedData.date || null,
        supplier: parsedData.supplier || null,
        documentType: parsedData.documentType || null,
        confidence,
        rawText: parsedData.rawText
      },
      metadata: {
        analyzedBy: 'system',
        organizationId: 'unknown',
        analyzedAt: new Date().toISOString(),
        confidence,
        method: 'ai'
      },
      method: 'ai'
    };

  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    throw error; // Let the fallback handle it
  }
}

/**
 * Fallback regex-based document analysis
 * @param fileBuffer - The file buffer
 * @param mimeType - The MIME type
 * @param filename - The filename
 * @returns Promise resolving to analysis result
 */
async function analyzeWithRegex(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<DocumentAnalysisResult> {
  // For now, return basic analysis since we can't extract text from images/PDFs without OCR
  // In a real implementation, you would use a PDF/text extraction library here
  
  const documentType = determineDocumentTypeFromFilename(filename);
  const confidence = 0.3; // Low confidence for regex fallback
  
  return {
    success: true,
    data: {
      amount: null,
      currency: null,
      date: null,
      supplier: null,
      documentType,
      confidence
    },
    metadata: {
      analyzedBy: 'system',
      organizationId: 'unknown',
      analyzedAt: new Date().toISOString(),
      confidence,
      method: 'regex'
    },
    method: 'regex'
  };
}

/**
 * Determines document type from filename
 * @param filename - The filename
 * @returns Document type string
 */
function determineDocumentTypeFromFilename(filename: string): string {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('invoice') || lowerFilename.includes('facture')) {
    return 'invoice';
  }
  if (lowerFilename.includes('receipt') || lowerFilename.includes('reçu')) {
    return 'receipt';
  }
  if (lowerFilename.includes('contract') || lowerFilename.includes('contrat')) {
    return 'contract';
  }
  if (lowerFilename.includes('bill') || lowerFilename.includes('note')) {
    return 'bill';
  }
  
  return 'other';
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
    metadata: result.metadata
  };
}