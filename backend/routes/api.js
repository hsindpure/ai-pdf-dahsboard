// backend/routes/api.js
const express = require('express');
const router = express.Router();

// Import services
let upload, documentProcessor, aiService, calculator;

try {
  upload = require('../middleware/upload');
  documentProcessor = require('../services/documentProcessor');
  aiService = require('../services/aiService');
  calculator = require('../services/calculator');
  console.log('✅ All services loaded successfully');
} catch (error) {
  console.log('⚠️ Some services not found, using basic routes only');
}

// Store sessions in memory (use Redis in production)
const sessions = new Map();

// Clean up old sessions periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [sessionId, sessionData] of sessions.entries()) {
    if (now - new Date(sessionData.uploadTime).getTime() > maxAge) {
      sessions.delete(sessionId);
      console.log(`🗑️ Cleaned up expired session: ${sessionId}`);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Document Dashboard API is working perfectly!',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/test',
      'POST /api/upload',
      'GET /api/session/:sessionId',
      'POST /api/generate-dashboard'
    ]
  });
});

// File upload and processing
if (upload && documentProcessor && aiService) {
  router.post('/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      console.log('📄 Processing uploaded file:', req.file.originalname);

      // Extract text from document
      const extractionResult = await documentProcessor.processFile(req.file);
      
      // Analyze document with AI
      const analysisResult = await aiService.analyzeDocument(
        extractionResult.extractedText, 
        extractionResult.fileName
      );

      // Create session
      const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      if (analysisResult.hasData) {
        // Store successful analysis in session
        sessions.set(sessionId, {
          fileName: extractionResult.fileName,
          fileType: extractionResult.fileType,
          extractedText: extractionResult.extractedText,
          contentLength: extractionResult.contentLength,
          data: analysisResult.data.data,
          schema: analysisResult.data.schema,
          metadata: analysisResult.data.metadata,
          dashboardConfig: analysisResult.dashboard,
          uploadTime: new Date().toISOString(),
          hasData: true
        });

        console.log(`✅ Document processed successfully. Session ID: ${sessionId}`);

        res.json({
          success: true,
          sessionId,
          hasData: true,
          message: 'Document processed successfully',
          preview: {
            fileName: extractionResult.fileName,
            fileType: extractionResult.fileType,
            dataRecords: analysisResult.data.data.length,
            confidence: analysisResult.data.metadata.extractionConfidence,
            summary: analysisResult.dashboard.summary
          }
        });
      } else {
        // Store failed analysis for debugging
        sessions.set(sessionId, {
          fileName: extractionResult.fileName,
          fileType: extractionResult.fileType,
          extractedText: extractionResult.extractedText,
          contentLength: extractionResult.contentLength,
          uploadTime: new Date().toISOString(),
          hasData: false,
          reason: analysisResult.reason
        });

        res.json({
          success: true,
          sessionId,
          hasData: false,
          message: 'Document processed but no dashboard data found',
          reason: analysisResult.reason
        });
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing document: ' + error.message
      });
    }
  });
} else {
  router.post('/upload', (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Upload service not available. Please check if all files are properly set up.'
    });
  });
}

// Get session data
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionData = sessions.get(sessionId);

    if (!sessionData) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: sessionData
    });

  } catch (error) {
    console.error('❌ Session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving session'
    });
  }
});

// Generate dashboard
if (calculator) {
  router.post('/generate-dashboard', async (req, res) => {
    try {
      const { sessionId } = req.body;
      const sessionData = sessions.get(sessionId);

      if (!sessionData) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (!sessionData.hasData) {
        return res.status(400).json({
          success: false,
          message: 'No dashboard data available for this session',
          reason: sessionData.reason
        });
      }

      console.log(`📊 Generating dashboard for session: ${sessionId}`);

      // Calculate KPIs
      const kpis = calculator.calculateKPIs(sessionData.data, sessionData.dashboardConfig.kpis);

      // Generate charts
      const charts = calculator.generateChartConfigs(sessionData.data, sessionData.dashboardConfig.charts);

      console.log(`✅ Dashboard generated with ${kpis.length} KPIs and ${charts.length} charts`);

      res.json({
        success: true,
        dashboard: {
          kpis,
          charts,
          insights: sessionData.dashboardConfig.insights || [],
          summary: sessionData.dashboardConfig.summary,
          dataInfo: {
            totalRecords: sessionData.data.length,
            dataSource: sessionData.metadata?.dataSource || 'document extraction',
            confidence: sessionData.metadata?.extractionConfidence || 'unknown'
          }
        }
      });

    } catch (error) {
      console.error('❌ Dashboard generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating dashboard: ' + error.message
      });
    }
  });
} else {
  router.post('/generate-dashboard', (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Dashboard service not available'
    });
  });
}

// Get all sessions (for debugging)
router.get('/sessions', (req, res) => {
  const sessionList = Array.from(sessions.keys()).map(key => {
    const sessionData = sessions.get(key);
    return {
      sessionId: key,
      fileName: sessionData?.fileName,
      fileType: sessionData?.fileType,
      uploadTime: sessionData?.uploadTime,
      hasData: sessionData?.hasData,
      dataRecords: sessionData?.data?.length || 0
    };
  });

  res.json({
    success: true,
    sessions: sessionList,
    totalSessions: sessionList.length
  });
});

// Clear all sessions (for debugging)
router.delete('/sessions', (req, res) => {
  const count = sessions.size;
  sessions.clear();
  
  res.json({
    success: true,
    message: `Cleared ${count} sessions`
  });
});


router.get('/raw-data/:sessionId', (req, res) => {
    try {
      const { sessionId } = req.params;
      const sessionData = sessions.get(sessionId);
  
      if (!sessionData) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
  
      // Return all raw data for debugging
      const rawData = {
        sessionId: sessionId,
        fileName: sessionData.fileName,
        fileType: sessionData.fileType,
        uploadTime: sessionData.uploadTime,
        hasData: sessionData.hasData,
        
        // Raw extracted text from OCR/PDF
        extractedText: sessionData.extractedText,
        extractedTextLength: sessionData.extractedText?.length || 0,
        
        // Structured data (if AI found any)
        structuredData: sessionData.data || null,
        dataRecords: sessionData.data?.length || 0,
        
        // Schema information
        schema: sessionData.schema || null,
        
        // AI analysis metadata
        metadata: sessionData.metadata || null,
        
        // Dashboard configuration
        dashboardConfig: sessionData.dashboardConfig || null,
        
        // Error reason (if no data found)
        reason: sessionData.reason || null,
        
        // Content preview (first 500 characters)
        textPreview: sessionData.extractedText ? 
          sessionData.extractedText.substring(0, 500) + 
          (sessionData.extractedText.length > 500 ? '...' : '') : null
      };
  
      res.json({
        success: true,
        rawData: rawData
      });
  
    } catch (error) {
      console.error('Raw data error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving raw data'
      });
    }
  });
  
  // Get just the extracted text (useful for debugging OCR)
  router.get('/extracted-text/:sessionId', (req, res) => {
    try {
      const { sessionId } = req.params;
      const sessionData = sessions.get(sessionId);
  
      if (!sessionData) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
  
      res.json({
        success: true,
        extractedText: sessionData.extractedText,
        fileName: sessionData.fileName,
        fileType: sessionData.fileType,
        textLength: sessionData.extractedText?.length || 0,
        uploadTime: sessionData.uploadTime
      });
  
    } catch (error) {
      console.error('Extracted text error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving extracted text'
      });
    }
  });

module.exports = router;