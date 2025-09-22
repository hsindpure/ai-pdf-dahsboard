// backend/services/documentProcessor.js - Enhanced with size limits
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const sharp = require('sharp');

class DocumentProcessor {
  constructor() {
    this.tesseractWorker = null;
    this.TEXT_SIZE_LIMITS = {
      maxChars: 100000,        // 100K characters max
      warningThreshold: 50000, // Warn at 50K characters
      chunkSize: 20000,        // Process in 20K chunks if needed
      maxPages: 50             // Limit PDF pages processed
    };
  }

  async initTesseract() {
    if (!this.tesseractWorker) {
      this.tesseractWorker = await createWorker();
      await this.tesseractWorker.loadLanguage('eng');
      await this.tesseractWorker.initialize('eng');
    }
  }

  async processFile(file) {
    try {
      console.log(`Processing file: ${file.originalname} (${this.formatFileSize(file.size)})`);
      
      const extension = path.extname(file.originalname).toLowerCase();
      let extractedText = '';
      
      // Check file size before processing
      this.validateFileSize(file, extension);
      
      if (extension === '.pdf') {
        extractedText = await this.processPDF(file.path);
      } else if (['.png', '.jpg', '.jpeg'].includes(extension)) {
        extractedText = await this.processImage(file.path);
      } else {
        throw new Error('Unsupported file format');
      }
      
      // Clean up uploaded file
      this.cleanupFile(file.path);
      
      // Validate extracted text size
      const textInfo = this.validateTextSize(extractedText);
      
      console.log(`Text extraction complete: ${textInfo.chars} chars, ${textInfo.words} words, estimated ${textInfo.tokens} tokens`);
      
      return {
        extractedText: textInfo.processedText,
        fileName: file.originalname,
        fileType: extension,
        contentLength: textInfo.chars,
        processingInfo: {
          originalLength: extractedText.length,
          processedLength: textInfo.processedText.length,
          wasLimited: textInfo.wasLimited,
          estimatedTokens: textInfo.tokens
        }
      };
      
    } catch (error) {
      console.error('Document processing error:', error);
      this.cleanupFile(file.path);
      throw error;
    }
  }

  validateFileSize(file, extension) {
    const limits = {
      '.pdf': 50 * 1024 * 1024,  // 50MB for PDFs
      '.png': 20 * 1024 * 1024,  // 20MB for images
      '.jpg': 20 * 1024 * 1024,  // 20MB for images
      '.jpeg': 20 * 1024 * 1024  // 20MB for images
    };

    const maxSize = limits[extension] || 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      const limitMB = Math.round(maxSize / (1024 * 1024));
      const fileMB = Math.round(file.size / (1024 * 1024));
      throw new Error(`File too large: ${fileMB}MB exceeds ${limitMB}MB limit for ${extension} files`);
    }
  }

  validateTextSize(text) {
    const chars = text.length;
    const words = text.split(/\s+/).length;
    const tokens = Math.ceil(chars / 4); // Rough estimate
    
    let processedText = text;
    let wasLimited = false;
    
    if (chars > this.TEXT_SIZE_LIMITS.maxChars) {
      console.log(`Text too large (${chars} chars), applying intelligent truncation...`);
      processedText = this.truncateIntelligently(text);
      wasLimited = true;
    } else if (chars > this.TEXT_SIZE_LIMITS.warningThreshold) {
      console.log(`Large text detected (${chars} chars), but within limits`);
    }
    
    return {
      chars,
      words,
      tokens,
      processedText,
      wasLimited
    };
  }

  truncateIntelligently(text) {
    // Strategy 1: Extract sections with numerical data first
    const numericalSections = this.extractNumericalSections(text);
    
    if (numericalSections.length > 0 && numericalSections.join('\n').length <= this.TEXT_SIZE_LIMITS.maxChars) {
      console.log('Using extracted numerical sections');
      return numericalSections.join('\n\n');
    }
    
    // Strategy 2: Take first portion and preserve tables/data
    const targetSize = this.TEXT_SIZE_LIMITS.maxChars;
    const sections = text.split(/\n\s*\n/); // Split by double newlines
    let result = '';
    let preservedSections = [];
    
    // First pass: collect sections with data
    for (let section of sections) {
      if (this.sectionContainsData(section)) {
        preservedSections.push(section);
      }
    }
    
    // Second pass: add preserved sections within limit
    for (let section of preservedSections) {
      if ((result + section).length <= targetSize) {
        result += section + '\n\n';
      } else {
        break;
      }
    }
    
    // If still room, add other sections
    if (result.length < targetSize * 0.8) {
      for (let section of sections) {
        if (!preservedSections.includes(section) && (result + section).length <= targetSize) {
          result += section + '\n\n';
        }
      }
    }
    
    return result.trim();
  }

  extractNumericalSections(text) {
    const sections = text.split(/\n\s*\n/);
    return sections.filter(section => this.sectionContainsData(section));
  }

  sectionContainsData(section) {
    const dataPatterns = [
      /\$[\d,]+\.?\d*/,              // Currency
      /\d+\.?\d*%/,                 // Percentages
      /\d{1,3}(,\d{3})*/,          // Large numbers with commas
      /\b(revenue|sales|profit|cost|price|total|amount)\b.*\d/i, // Financial terms with numbers
      /\|\s*\d+/,                   // Table structures
      /\b(q1|q2|q3|q4|quarter)\b.*\d/i, // Quarterly data
      /\b\d+\s*(million|billion|thousand|k|m|b)\b/i, // Abbreviated numbers
      /\b\d{4}[-\/]\d{2}[-\/]\d{2}/,   // Dates
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b.*\d/i // Month with numbers
    ];
    
    return dataPatterns.some(pattern => pattern.test(section));
  }

  async processPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const options = {
        max: this.TEXT_SIZE_LIMITS.maxPages // Limit pages processed
      };
      
      const pdfData = await pdf(dataBuffer, options);
      
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new Error('PDF contains no readable text');
      }
      
      if (pdfData.numpages > this.TEXT_SIZE_LIMITS.maxPages) {
        console.log(`PDF has ${pdfData.numpages} pages, processing first ${this.TEXT_SIZE_LIMITS.maxPages} pages`);
      }
      
      return pdfData.text;
      
    } catch (error) {
      throw new Error('Failed to extract text from PDF: ' + error.message);
    }
  }

  async processImage(filePath) {
    try {
      await this.initTesseract();
      
      // Check image dimensions and resize if too large
      const processedImagePath = await this.preprocessImage(filePath);
      
      // Perform OCR with progress logging for large images
      console.log('Starting OCR processing...');
      const { data: { text } } = await this.tesseractWorker.recognize(processedImagePath);
      console.log('OCR processing complete');
      
      // Clean up processed image
      if (processedImagePath !== filePath) {
        this.cleanupFile(processedImagePath);
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text found in image. Image may be unclear or contain no readable text.');
      }
      
      return text;
      
    } catch (error) {
      throw new Error('Failed to extract text from image: ' + error.message);
    }
  }

  async preprocessImage(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      console.log(`Image: ${metadata.width}x${metadata.height}, ${this.formatFileSize(metadata.size || 0)}`);
      
      // Skip preprocessing for small images
      if (metadata.width <= 2000 && metadata.height <= 2000) {
        return imagePath;
      }
      
      const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');
      
      await sharp(imagePath)
        .resize(null, 1600, { // Max height 1600px
          withoutEnlargement: true,
          fit: 'inside'
        })
        .greyscale()
        .normalize()
        .sharpen()
        .png({ quality: 90 })
        .toFile(outputPath);
      
      console.log('Image preprocessed for better OCR accuracy');
      return outputPath;
      
    } catch (error) {
      console.warn('Image preprocessing failed, using original:', error.message);
      return imagePath;
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Cleaned up file:', filePath);
      }
    } catch (error) {
      console.warn('Could not cleanup file:', error.message);
    }
  }

  async destroy() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }
}

module.exports = new DocumentProcessor();
