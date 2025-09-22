// frontend/src/App.js
import React, { useState } from 'react';
import { ConfigProvider, theme, message } from 'antd';
import LandingPage from './components/LandingPage';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';

function App() {
  const [currentStep, setCurrentStep] = useState('landing'); // landing, upload, dashboard, no-data
  const [sessionId, setSessionId] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [noDataReason, setNoDataReason] = useState('');

  const handleGetStarted = () => {
    setCurrentStep('upload');
  };

  const handleFileUploaded = (uploadResult) => {
    setSessionId(uploadResult.sessionId);
    setFileInfo(uploadResult.preview);
    
    if (uploadResult.hasData) {
      setCurrentStep('dashboard');
      message.success('Dashboard data found! Generating visualizations...');
    } else {
      setCurrentStep('no-data');
      setNoDataReason(uploadResult.reason);
      message.warning('No dashboard data found in the document');
    }
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setSessionId(null);
    setFileInfo(null);
    setNoDataReason('');
  };

  const handleBackToLanding = () => {
    setCurrentStep('landing');
    setSessionId(null);
    setFileInfo(null);
    setNoDataReason('');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const renderNoDataPage = () => (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: isDarkMode ? '#141414' : '#f0f2f5',
      padding: '24px'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        textAlign: 'center',
        background: isDarkMode ? '#1f1f1f' : '#fff',
        padding: '48px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontSize: '72px', marginBottom: '24px' }}>📄</div>
        <h2 style={{ 
          color: isDarkMode ? '#fff' : '#000',
          marginBottom: '16px',
          fontSize: '24px'
        }}>
          Unable to Generate Dashboard
        </h2>
        <p style={{ 
          color: isDarkMode ? '#a0a0a0' : '#666',
          marginBottom: '32px',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          {noDataReason || 'The uploaded document does not contain numerical or tabular data suitable for dashboard creation.'}
        </p>
        <div style={{ 
          background: isDarkMode ? '#262626' : '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '32px',
          textAlign: 'left'
        }}>
          <h4 style={{ color: isDarkMode ? '#fff' : '#000', marginBottom: '12px' }}>
            For better results, try documents with:
          </h4>
          <ul style={{ color: isDarkMode ? '#a0a0a0' : '#666', margin: 0, paddingLeft: '20px' }}>
            <li>Financial reports with numbers</li>
            <li>Sales data and statistics</li>
            <li>Tables with numerical values</li>
            <li>Performance metrics and KPIs</li>
            <li>Survey results with data</li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleBackToUpload}
            style={{
              background: '#1890ff',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Try Another Document
          </button>
          <button
            onClick={handleBackToLanding}
            style={{
              background: 'transparent',
              color: isDarkMode ? '#fff' : '#666',
              border: `1px solid ${isDarkMode ? '#434343' : '#d9d9d9'}`,
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <div style={{ minHeight: '100vh' }}>
        {currentStep === 'landing' && (
          <LandingPage 
            onGetStarted={handleGetStarted}
            onToggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
          />
        )}
        
        {currentStep === 'upload' && (
          <FileUpload 
            onFileUploaded={handleFileUploaded}
            onBack={handleBackToLanding}
            onToggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
          />
        )}
        
        {currentStep === 'no-data' && renderNoDataPage()}
        
        {currentStep === 'dashboard' && sessionId && (
          <Dashboard 
            sessionId={sessionId}
            fileInfo={fileInfo}
            onBack={handleBackToUpload}
            onNewFile={handleBackToLanding}
            onToggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </ConfigProvider>
  );
}

export default App;