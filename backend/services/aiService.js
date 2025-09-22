// backend/services/aiService.js - Enhanced with chunking and token management
const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = process.env.OPENROUTER_API_URL;
    this.model = process.env.OPENROUTER_API_MODEL;
    
    // Token limits for different operations
    this.TOKEN_LIMITS = {
      maxInputTokens: 8000,        // Safe limit for input text
      maxPromptTokens: 1500,       // Tokens for prompt structure
      safeTextLimit: 6000,         // Safe limit for extracted text
      chunkOverlap: 200,           // Overlap between chunks
      summaryTokens: 1000          // Tokens for summary operations
    };
  }

  // Estimate token count (rough approximation: 1 token ≈ 4 characters)
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  // Split text into manageable chunks
  chunkText(text, maxChunkSize = 5000) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let currentChunk = '';
    
    for (let sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  // Extract numerical data from text chunks
  extractNumericalContent(text) {
    // Find lines/sections that contain numbers, tables, or financial data
    const lines = text.split('\n');
    const numericalLines = [];
    
    for (let line of lines) {
      // Check if line contains numbers, currency, percentages, or table-like structure
      if (this.containsNumericalData(line)) {
        numericalLines.push(line.trim());
      }
    }
    
    return numericalLines.join('\n');
  }

  containsNumericalData(line) {
    const numericalPatterns = [
      /\$[\d,]+\.?\d*/,              // Currency
      /\d+\.?\d*%/,                 // Percentages  
      /\d{1,3}(,\d{3})*/,          // Large numbers with commas
      /\b\d+\.?\d*\s*(million|billion|thousand|k|m|b)\b/i, // Abbreviated numbers
      /\b(revenue|sales|profit|cost|price|total|amount|quantity)\b.*\d/i, // Financial terms with numbers
      /\|\s*\d+/,                   // Table-like structures
      /\d+\s*\|\s*\d+/,            // Table rows
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b.*\d/i, // Dates with numbers
      /\b(q1|q2|q3|q4|quarter)\b.*\d/i, // Quarterly data
      /\b\d+\s*(units|items|customers|employees|hours|days|months|years)\b/i // Quantities
    ];
    
    return numericalPatterns.some(pattern => pattern.test(line));
  }

  async analyzeDocument(extractedText, fileName) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      console.log(`Analyzing document with AI: ${fileName} (${extractedText.length} characters)`);
      
      // Handle large text by preprocessing and chunking
      const processedText = await this.preprocessLargeText(extractedText);
      
      // Check if document contains numerical/tabular data
      const analysisResult = await this.checkDataAvailability(processedText);
      
      if (analysisResult.hasData) {
        // Extract and structure the data using chunked approach
        const structuredData = await this.extractStructuredDataWithChunking(extractedText, analysisResult);
        
        // Generate dashboard configuration
        const dashboardConfig = await this.generateDashboardConfig(structuredData);
        
        return {
          success: true,
          hasData: true,
          data: structuredData,
          dashboard: dashboardConfig,
          insights: analysisResult.insights || [],
          processingInfo: {
            originalLength: extractedText.length,
            processedLength: processedText.length,
            tokenEstimate: this.estimateTokens(processedText)
          }
        };
      } else {
        return {
          success: true,
          hasData: false,
          reason: analysisResult.reason || 'No numerical or tabular data found suitable for dashboard creation'
        };
      }

    } catch (error) {
      console.error('AI analysis error:', error);
      throw error;
    }
  }

  async preprocessLargeText(text) {
    const tokenCount = this.estimateTokens(text);
    
    console.log(`Text analysis: ${text.length} chars, ~${tokenCount} tokens`);
    
    // If text is within limits, use as-is
    if (tokenCount <= this.TOKEN_LIMITS.safeTextLimit) {
      return text;
    }
    
    console.log('Large text detected, applying intelligent preprocessing...');
    
    // Strategy 1: Extract only numerical/tabular content
    const numericalContent = this.extractNumericalContent(text);
    console.log(`Extracted numerical content: ${numericalContent.length} chars`);
    
    if (numericalContent.length > 0 && this.estimateTokens(numericalContent) <= this.TOKEN_LIMITS.safeTextLimit) {
      return numericalContent;
    }
    
    // Strategy 2: Use AI to summarize while preserving data
    if (numericalContent.length > 0) {
      return await this.summarizePreservingData(numericalContent);
    }
    
    // Strategy 3: Chunk and analyze most promising sections
    return await this.selectBestChunks(text);
  }

  async summarizePreservingData(text) {
    try {
      const prompt = `Summarize this text while preserving ALL numerical data, tables, charts, financial information, and statistics. Keep exact numbers, percentages, dates, and quantitative information intact.

Text to summarize:
"""
${text.substring(0, 6000)}
"""

Requirements:
- Preserve all numbers, percentages, financial data
- Keep table structures and data relationships
- Maintain dates and time periods
- Remove only descriptive text and explanations
- Output should be concise but data-complete

Provide the summary in plain text format.`;

      const response = await this.callAI(prompt, 1500, 0.1);
      console.log(`AI summarization: ${text.length} -> ${response.length} chars`);
      return response;
      
    } catch (error) {
      console.warn('AI summarization failed, using chunking fallback:', error.message);
      return this.selectBestChunks(text);
    }
  }

  async selectBestChunks(text) {
    // Split into chunks and select those most likely to contain dashboard data
    const chunks = this.chunkText(text, 4000);
    console.log(`Split into ${chunks.length} chunks`);
    
    // Score chunks based on numerical content density
    const scoredChunks = chunks.map(chunk => ({
      content: chunk,
      score: this.scoreChunkForDashboardData(chunk)
    })).sort((a, b) => b.score - a.score);
    
    // Take top 2-3 chunks that fit within token limits
    let selectedContent = '';
    let totalTokens = 0;
    
    for (let chunk of scoredChunks) {
      const chunkTokens = this.estimateTokens(chunk.content);
      if (totalTokens + chunkTokens <= this.TOKEN_LIMITS.safeTextLimit) {
        selectedContent += chunk.content + '\n\n';
        totalTokens += chunkTokens;
      } else {
        break;
      }
    }
    
    console.log(`Selected best chunks: ${selectedContent.length} chars, ~${totalTokens} tokens`);
    return selectedContent;
  }

  scoreChunkForDashboardData(chunk) {
    let score = 0;
    
    // Count numerical patterns
    const numericalPatterns = [
      /\$[\d,]+\.?\d*/g,           // Currency
      /\d+\.?\d*%/g,              // Percentages
      /\d{1,3}(,\d{3})*/g,        // Large numbers
      /\b(revenue|sales|profit|cost|total|amount)\b/gi, // Financial terms
      /\|\s*\d+/g,                // Tables
      /\b(q1|q2|q3|q4|quarter)\b/gi // Quarters
    ];
    
    numericalPatterns.forEach(pattern => {
      const matches = chunk.match(pattern);
      if (matches) {
        score += matches.length;
      }
    });
    
    // Boost score for table-like structures
    const lines = chunk.split('\n');
    const tableLines = lines.filter(line => 
      (line.includes('|') && /\d/.test(line)) || 
      (line.split(/\s+/).length > 3 && /\d.*\d/.test(line))
    );
    score += tableLines.length * 2;
    
    return score;
  }

  async extractStructuredDataWithChunking(originalText, analysisResult) {
    try {
      // Use preprocessed text for extraction
      const processedText = await this.preprocessLargeText(originalText);
      
      const prompt = `Extract and structure numerical/tabular data from this text. Based on analysis finding: ${analysisResult.insights.join(', ')}

Text:
"""
${processedText}
"""

Create structured dataset. Respond with ONLY a JSON object:
{
  "data": [
    {"category": "Q1", "revenue": 50000, "date": "2024-01-01"},
    {"category": "Q2", "revenue": 60000, "date": "2024-04-01"}
  ],
  "schema": {
    "measures": [{"name": "revenue", "type": "number"}],
    "dimensions": [{"name": "category", "type": "string"}]
  },
  "metadata": {
    "totalRecords": 2,
    "dataSource": "extracted from document",
    "extractionConfidence": 85,
    "processingMethod": "chunked_analysis"
  }
}

Requirements:
- Extract ALL numerical data found
- Create consistent column names
- Include at least 3 data points
- Convert text numbers to actual numbers
- No markdown formatting, just JSON`;

      const response = await this.callAI(prompt, 2000);
      const result = this.parseJSONResponse(response);
      
      // Validate extracted data
      if (!result.data || !Array.isArray(result.data) || result.data.length < 2) {
        throw new Error('Insufficient data extracted for dashboard creation');
      }
      
      return result;
      
    } catch (error) {
      throw new Error('Failed to extract structured data: ' + error.message);
    }
  }

  async checkDataAvailability(text) {
    // Use processed/truncated text for availability check
    const checkText = text.length > 4000 ? text.substring(0, 4000) + '...[truncated]' : text;
    
    const prompt = `Analyze this text for numerical/tabular data suitable for dashboard creation.

Look for: tables, financial data, metrics, statistics, time-series data.

Text (${text.length} chars):
"""
${checkText}
"""

Respond with ONLY this JSON format:
{
  "hasData": true,
  "confidence": 85,
  "reason": "Found financial table with revenue data",
  "insights": ["revenue data", "quarterly metrics"],
  "dataTypes": ["revenue", "dates", "quantities"]
}`;

    try {
      const response = await this.callAI(prompt, 500);
      return this.parseJSONResponse(response);
    } catch (error) {
      throw new Error('Failed to analyze data availability: ' + error.message);
    }
  }

  async generateDashboardConfig(structuredData) {
    const { data, schema } = structuredData;
    
    const prompt = `Create dashboard configuration for this data:

Sample: ${JSON.stringify(data.slice(0, 3))}
Schema: ${JSON.stringify(schema)}
Records: ${data.length}

Respond with ONLY this JSON:
{
  "kpis": [
    {
      "name": "Total Revenue",
      "calculation": "sum", 
      "column": "revenue",
      "format": "currency"
    }
  ],
  "charts": [
    {
      "title": "Revenue Trend",
      "type": "bar",
      "measures": ["revenue"],
      "dimensions": ["category"]
    }
  ],
  "insights": ["Key business insights"],
  "summary": "Dashboard shows financial performance data"
}`;

    try {
      const response = await this.callAI(prompt, 1500);
      return this.parseJSONResponse(response);
    } catch (error) {
      throw new Error('Failed to generate dashboard config: ' + error.message);
    }
  }

  async callAI(prompt, maxTokens = 1000, temperature = 0.1) {
    try {
      // Validate prompt size
      const promptTokens = this.estimateTokens(prompt);
      if (promptTokens > this.TOKEN_LIMITS.maxInputTokens) {
        throw new Error(`Prompt too large: ${promptTokens} tokens (max: ${this.TOKEN_LIMITS.maxInputTokens})`);
      }

      const response = await axios.post(this.baseUrl, {
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: temperature
      }, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 45000
      });

      return response.data.choices[0]?.message?.content;
    } catch (error) {
      if (error.response?.status === 400 && error.response.data?.error?.message?.includes('token')) {
        throw new Error('Text too long for AI processing. Document contains too much content.');
      }
      
      if (error.response) {
        throw new Error(`AI API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('Network error: Could not reach AI service');
      } else {
        throw new Error('AI request failed: ' + error.message);
      }
    }
  }

  parseJSONResponse(response) {
    try {
      let cleanResponse = response.trim();
      
      // Remove markdown formatting
      cleanResponse = cleanResponse.replace(/```json\s*/g, '');
      cleanResponse = cleanResponse.replace(/```\s*/g, '');
      
      // Extract JSON from response
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Raw AI response:', response.substring(0, 500));
      throw new Error('Invalid JSON response from AI: ' + error.message);
    }
  }
}

module.exports = new AIService();
