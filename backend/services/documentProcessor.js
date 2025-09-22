// backend/services/documentProcessor.js
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const sharp = require('sharp');

class DocumentProcessor {
  constructor() {
    this.tesseractWorker = null;
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
      console.log('Processing file:', file.originalname);
      
      const extension = path.extname(file.originalname).toLowerCase();
      let extractedText = '';
      
      if (extension === '.pdf') {
        extractedText = await this.processPDF(file.path);
      } else if (['.png', '.jpg', '.jpeg'].includes(extension)) {
        extractedText = await this.processImage(file.path);
      } else {
        throw new Error('Unsupported file format');
      }
      
      // Clean up uploaded file
      this.cleanupFile(file.path);
      
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('No readable content found in the document');
      }
      
      console.log('Text extracted successfully:', extractedText.length, 'characters');
      
      return {
        extractedText,
        fileName: file.originalname,
        fileType: extension,
        contentLength: extractedText.length
      };
      
    } catch (error) {
      console.error('Document processing error:', error);
      this.cleanupFile(file.path);
      throw error;
    }
  }

  async processPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new Error('PDF contains no readable text');
      }
      
      return pdfData.text;
      
    } catch (error) {
      throw new Error('Failed to extract text from PDF: ' + error.message);
    }
  }

  async processImage(filePath) {
    try {
      await this.initTesseract();
      
      // Preprocess image for better OCR
      const processedImagePath = await this.preprocessImage(filePath);
      
      // Perform OCR
      const { data: { text } } = await this.tesseractWorker.recognize(processedImagePath);
      
      // Clean up processed image
      if (processedImagePath !== filePath) {
        this.cleanupFile(processedImagePath);
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text found in image');
      }
      
      return text;
      
    } catch (error) {
      throw new Error('Failed to extract text from image: ' + error.message);
    }
  }

  async preprocessImage(imagePath) {
    try {
      const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');
      
      await sharp(imagePath)
        .resize(null, 1200, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .greyscale()
        .normalize()
        .sharpen()
        .png({ quality: 90 })
        .toFile(outputPath);
      
      return outputPath;
      
    } catch (error) {
      console.warn('Image preprocessing failed, using original:', error.message);
      return imagePath;
    }
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