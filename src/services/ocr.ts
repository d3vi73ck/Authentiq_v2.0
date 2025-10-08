/**
 * OCR Service for Document Text Extraction
 * Uses Tesseract.js for OCR processing of images and PDFs
 */

export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
  error?: string;
}

/**
 * Extracts text from an image or PDF using Tesseract.js OCR
 * @param fileBuffer - The file buffer to process
 * @param mimeType - The MIME type of the file
 * @param filename - The original filename
 * @param language - Language code for OCR (default: 'fra+eng')
 * @returns Promise resolving to OCR result
 */
export async function extractText(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string,
  language: string = 'fra+eng'
): Promise<OCRResult> {
  const startTime = Date.now();
  
  try {
    // Dynamically import Tesseract.js to avoid server-side bundling issues
    const { createWorker } = await import('tesseract.js');
    
    const worker = await createWorker(language);
    
    try {
      // Configure OCR parameters for better performance
      await worker.setParameters({
        tessedit_pageseg_mode: 6 as any, // Uniform block of text (PSM.SINGLE_BLOCK)
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÂÄÇÉÈÊËÎÏÔÖÙÛÜàâäçéèêëîïôöùûü.,-€$£ /\\():',
        preserve_interword_spaces: '1',
      });
      
      // Convert buffer to appropriate format for Tesseract
      let imageData: Buffer | string;
      
      if (mimeType.startsWith('image/')) {
        // For images, use the buffer directly
        imageData = fileBuffer;
      } else if (mimeType === 'application/pdf') {
        // For PDFs, we need to convert to image first
        // For now, return empty result as PDF processing requires additional libraries
        console.warn('PDF OCR requires PDF.js or similar library for conversion');
        return {
          success: false,
          text: '',
          confidence: 0,
          language,
          processingTime: Date.now() - startTime,
          error: 'PDF OCR requires additional processing setup'
        };
      } else {
        throw new Error(`Unsupported MIME type for OCR: ${mimeType}`);
      }
      
      // Perform OCR
      const { data } = await worker.recognize(imageData);
      
      return {
        success: true,
        text: data.text.trim(),
        confidence: data.confidence / 100, // Convert to 0-1 scale
        language,
        processingTime: Date.now() - startTime
      };
      
    } finally {
      // Always terminate worker to free resources
      await worker.terminate();
    }
    
  } catch (error) {
    console.error('OCR processing error:', error);
    return {
      success: false,
      text: '',
      confidence: 0,
      language,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown OCR error occurred'
    };
  }
}

/**
 * Detects if a file type is suitable for OCR processing
 * @param mimeType - The MIME type to check
 * @returns boolean indicating if OCR is supported
 */
export function isOCRSupported(mimeType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/bmp',
    'application/pdf'
  ];
  
  return supportedTypes.includes(mimeType.toLowerCase());
}

/**
 * Gets supported languages for OCR processing
 * @returns Array of supported language codes
 */
export function getSupportedOCRLanguages(): string[] {
  return [
    'eng', // English
    'fra', // French
    'fra+eng', // French + English (default)
    'eng+fra' // English + French
  ];
}

/**
 * Processes multiple documents in batch with OCR
 * @param documents - Array of documents to process
 * @returns Promise resolving to array of OCR results
 */
export async function processDocumentsBatchOCR(
  documents: Array<{ buffer: Buffer; mimeType: string; filename: string }>
): Promise<OCRResult[]> {
  const results: OCRResult[] = [];
  
  // Process documents sequentially to avoid overwhelming the system
  for (const doc of documents) {
    const result = await extractText(doc.buffer, doc.mimeType, doc.filename);
    results.push(result);
  }
  
  return results;
}

/**
 * Validates OCR text quality and returns confidence metrics
 * @param text - The extracted OCR text
 * @returns Object with quality metrics
 */
export function validateOCRQuality(text: string): {
  hasContent: boolean;
  wordCount: number;
  lineCount: number;
  qualityScore: number;
} {
  const trimmedText = text.trim();
  const hasContent = trimmedText.length > 0;
  const wordCount = trimmedText.split(/\s+/).filter(word => word.length > 0).length;
  const lineCount = trimmedText.split('\n').filter(line => line.trim().length > 0).length;
  
  // Simple quality score based on content length and structure
  let qualityScore = 0;
  if (hasContent) {
    qualityScore = Math.min(wordCount / 10, 1); // Cap at 1.0
  }
  
  return {
    hasContent,
    wordCount,
    lineCount,
    qualityScore
  };
}