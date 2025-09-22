// backend/services/aiService.js
const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  async analyzeDocument(extractedText, fileName) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      console.log('Analyzing document with AI:', fileName);

      // First, check if document contains numerical/tabular data
      const analysisResult = await this.checkDataAvailability(extractedText);
      
      if (analysisResult.hasData) {
        // Extract and structure the data
        const structuredData = await this.extractStructuredData(extractedText, analysisResult);
        
        // Generate dashboard configuration
        const dashboardConfig = await this.generateDashboardConfig(structuredData);
        
        return {
          success: true,
          hasData: true,
          data: structuredData,
          dashboard: dashboardConfig,
          insights: analysisResult.insights || []
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

  async checkDataAvailability(text) {
    const prompt = `Analyze the following extracted text and determine if it contains numerical or tabular data suitable for creating a business dashboard.

Look for:
- Tables with numbers
- Financial data (revenue, costs, profits, etc.)
- Performance metrics
- Statistical data
- Time-series data
- Any structured numerical information

Text to analyze:
"""
${text.substring(0, 4000)} ${text.length > 4000 ? '...[truncated]' : ''}
"""

Respond with ONLY a JSON object in this exact format:
{
  "hasData": true,
  "confidence": 85,
  "reason": "Found financial table with revenue data",
  "insights": ["revenue data", "quarterly metrics"],
  "dataTypes": ["revenue", "dates", "quantities"]
}

Do not include any explanation or markdown formatting. Just the JSON object.`;

    try {
      const response = await this.callAI(prompt, 500);
      const result = this.parseJSONResponse(response);
      return result;
    } catch (error) {
      throw new Error('Failed to analyze data availability: ' + error.message);
    }
  }

  async extractStructuredData(text, analysisResult) {
    const prompt = `Extract and structure the numerical/tabular data from this text into a format suitable for dashboard creation.

Based on the analysis that found: ${analysisResult.insights.join(', ')}

Text:
"""
${text.substring(0, 6000)} ${text.length > 6000 ? '...[truncated]' : ''}
"""

Create a structured dataset. Respond with ONLY a JSON object in this exact format:
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
    "extractionConfidence": 85
  }
}

Important:
- Convert all numerical text to actual numbers
- Ensure consistent column names
- Include at least 3 data points
- Do not include any explanation or markdown formatting
- Respond only with the JSON object`;

    try {
      const response = await this.callAI(prompt, 2000);
      
      console.log("AI response", response);
      const result = this.parseJSONResponse(response);
      
      // Validate extracted data
      if (!result.data || !Array.isArray(result.data) || result.data.length < 3) {
        throw new Error('Insufficient data extracted for dashboard creation');
      }
      
      console.log("AI result", result);
      return result;

    } catch (error) {
      throw new Error('Failed to extract structured data: ' + error.message);
    }
  }

  async generateDashboardConfig(structuredData) {
    const { data, schema } = structuredData;
    
    const prompt = `Create a comprehensive dashboard configuration for this structured data:

Data Sample: ${JSON.stringify(data.slice(0, 5))}
Schema: ${JSON.stringify(schema)}
Total Records: ${data.length}

Generate dashboard configuration. Respond with ONLY a JSON object in this exact format:
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
      "title": "Revenue by Quarter",
      "type": "bar",
      "measures": ["revenue"],
      "dimensions": ["category"]
    }
  ],
  "insights": ["Revenue increased by 20% from Q1 to Q2"],
  "summary": "This dashboard shows quarterly revenue performance with key financial metrics"
}

Do not include any explanation or markdown formatting. Just the JSON object.`;

    try {
      const response = await this.callAI(prompt, 1500);
      const result = this.parseJSONResponse(response);
      return result;
    } catch (error) {
      throw new Error('Failed to generate dashboard config: ' + error.message);
    }
  }

  async callAI(prompt, maxTokens = 1000) {
    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.1
      }, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      });

      return response.data.choices[0]?.message?.content;
    } catch (error) {
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
      // Remove any markdown formatting and extra whitespace
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks
      cleanResponse = cleanResponse.replace(/```json\s*/g, '');
      cleanResponse = cleanResponse.replace(/```\s*/g, '');
      
      // Remove any leading/trailing text that might not be JSON
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Raw AI response:', response);
      throw new Error('Invalid JSON response from AI: ' + error.message);
    }
  }
}

module.exports = new AIService();