// frontend/src/components/FileUpload.js
import React, { useState } from 'react';
import { 
  Upload, 
  Button, 
  Typography, 
  Progress, 
  Card, 
  Space, 
  Alert,
  Row,
  Col,
  Switch,
  Spin,
  Descriptions
} from 'antd';
import { 
  InboxOutlined, 
  ArrowLeftOutlined, 
  FileTextOutlined,
  CheckCircleOutlined,
  SunOutlined,
  MoonOutlined,
  BarChartOutlined,
  RocketOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { apiService } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

const FileUpload = ({ onFileUploaded, onBack, onToggleTheme, isDarkMode }) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleUpload = async (file) => {
    try {
      setUploading(true);
      setProcessing(false);
      setError(null);
      setUploadProgress(0);
      setSuccess(false);
      setUploadResult(null);
      setProcessingStage('');

      console.log('Starting file upload:', file.name);

      // Upload file with progress
      const result = await apiService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
        if (progress === 100) {
          setUploading(false);
          setProcessing(true);
          setProcessingStage('Extracting text from document...');
        }
      });

      // Simulate processing stages for better UX
      const stages = [
        'Extracting text from document...',
        'Analyzing content with AI...',
        'Checking for numerical data...',
        'Generating dashboard structure...',
        'Finalizing results...'
      ];

      for (let i = 0; i < stages.length; i++) {
        setProcessingStage(stages[i]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setProcessing(false);
      setSuccess(true);
      setUploadResult(result);

      console.log('Upload completed:', result);

      // Auto-proceed after showing success
      setTimeout(() => {
        onFileUploaded(result);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed. Please try again.');
      setUploading(false);
      setProcessing(false);
      setUploadProgress(0);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.png,.jpg,.jpeg',
    showUploadList: false,
    beforeUpload: (file) => {
      // Validate file type
      const isValidType = file.type === 'application/pdf' || 
                         file.type === 'image/png' ||
                         file.type === 'image/jpeg' ||
                         file.type === 'image/jpg' ||
                         file.name.toLowerCase().endsWith('.pdf') ||
                         file.name.toLowerCase().endsWith('.png') ||
                         file.name.toLowerCase().endsWith('.jpg') ||
                         file.name.toLowerCase().endsWith('.jpeg');

      if (!isValidType) {
        setError('Please upload only PDF or image files (PNG, JPG, JPEG)');
        return false;
      }

      // Validate file size (50MB for PDF, 20MB for images)
      const maxSize = file.type === 'application/pdf' ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSize) {
        const limit = file.type === 'application/pdf' ? '50MB' : '20MB';
        setError(`File size must be less than ${limit}`);
        return false;
      }

      handleUpload(file);
      return false; // Prevent default upload
    }
  };

  const supportedFormats = [
    { type: 'PDF', description: 'Documents with tables and data', icon: '📄', maxSize: '50MB' },
    { type: 'PNG', description: 'Screenshots of data tables', icon: '🖼️', maxSize: '20MB' },
    { type: 'JPEG', description: 'Photos of documents', icon: '📸', maxSize: '20MB' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: isDarkMode ? '#141414' : '#f0f2f5' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 24px', 
        background: isDarkMode ? '#001529' : '#fff',
        borderBottom: `1px solid ${isDarkMode ? '#434343' : '#f0f0f0'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={onBack}
            style={{ color: isDarkMode ? '#fff' : '#000' }}
          >
            Back
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0, color: isDarkMode ? '#fff' : '#000' }}>
              Upload Your Document
            </Title>
          </div>
        </div>
        <Space>
          <SunOutlined style={{ color: isDarkMode ? '#fff' : '#000' }} />
          <Switch checked={isDarkMode} onChange={onToggleTheme} />
          <MoonOutlined style={{ color: isDarkMode ? '#fff' : '#000' }} />
        </Space>
      </div>

      {/* Main Content */}
      <div style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Upload Section */}
          <Card 
            style={{ 
              marginBottom: '32px',
              background: isDarkMode ? '#1f1f1f' : '#fff',
              borderColor: isDarkMode ? '#434343' : '#f0f0f0'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={2} style={{ color: isDarkMode ? '#fff' : '#000' }}>
                Upload Your Document
              </Title>
              <Paragraph style={{ fontSize: '16px', color: isDarkMode ? '#a0a0a0' : '#666' }}>
                Upload PDF documents or images containing numerical data for dashboard creation
              </Paragraph>
            </div>

            {!uploading && !processing && !success && (
              <Dragger 
                {...uploadProps}
                style={{ 
                  backgroundColor: isDarkMode ? '#2a2a2a' : '#fafafa',
                  borderColor: isDarkMode ? '#434343' : '#d9d9d9',
                  minHeight: '200px'
                }}
              >
                <p style={{ margin: '24px 0' }}>
                  <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                </p>
                <Title level={4} style={{ color: isDarkMode ? '#fff' : '#000' }}>
                  Click or drag document to this area to upload
                </Title>
                <Paragraph style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>
                  Support for PDF documents and images (PNG, JPG, JPEG).
                  <br />
                  AI will analyze the content for numerical data.
                </Paragraph>
              </Dragger>
            )}

            {uploading && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 24 }} />} />
                <Title level={4} style={{ marginTop: '24px', marginBottom: '16px', color: isDarkMode ? '#fff' : '#000' }}>
                  Uploading your document...
                </Title>
                <Progress 
                  percent={uploadProgress} 
                  status="active"
                  strokeColor="#1890ff"
                  style={{ marginBottom: '16px' }}
                />
                <Paragraph style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>
                  Please wait while we upload your file
                </Paragraph>
              </div>
            )}

            {processing && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 24 }} />} />
                <Title level={4} style={{ marginTop: '24px', marginBottom: '16px', color: isDarkMode ? '#fff' : '#000' }}>
                  AI is analyzing your document...
                </Title>
                <Paragraph style={{ 
                  color: '#1890ff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '16px'
                }}>
                  {processingStage}
                </Paragraph>
                <Paragraph style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>
                  This may take a few moments for large documents
                </Paragraph>
              </div>
            )}

            {success && uploadResult && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <CheckCircleOutlined 
                  style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} 
                />
                <Title level={4} style={{ color: isDarkMode ? '#fff' : '#000', marginBottom: '24px' }}>
                  Document processed successfully!
                </Title>
                
                <Card 
                  size="small" 
                  style={{ 
                    marginBottom: '24px',
                    background: isDarkMode ? '#262626' : '#f9f9f9',
                    borderColor: isDarkMode ? '#434343' : '#f0f0f0'
                  }}
                >
                  <Descriptions 
                    title={
                      <span style={{ color: isDarkMode ? '#fff' : '#000' }}>
                        Analysis Results
                      </span>
                    }
                    column={1}
                    size="small"
                  >
                    <Descriptions.Item 
                      label={<span style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>File Name</span>}
                    >
                      <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
                        {uploadResult.preview?.fileName}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<span style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>Status</span>}
                    >
                      <Text style={{ color: uploadResult.hasData ? '#52c41a' : '#fa8c16' }}>
                        {uploadResult.hasData ? 'Dashboard data found' : 'No dashboard data found'}
                      </Text>
                    </Descriptions.Item>
                    {uploadResult.hasData && uploadResult.preview && (
                      <>
                        <Descriptions.Item 
                          label={<span style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>Data Records</span>}
                        >
                          <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
                            {uploadResult.preview.dataRecords}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item 
                          label={<span style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>Confidence</span>}
                        >
                          <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
                            {uploadResult.preview.confidence}%
                          </Text>
                        </Descriptions.Item>
                      </>
                    )}
                  </Descriptions>
                </Card>

                <Paragraph style={{ color: isDarkMode ? '#a0a0a0' : '#666', marginBottom: '16px' }}>
                  {uploadResult.hasData ? 
                    'Redirecting to dashboard...' : 
                    'Document processed but no suitable data found for dashboard creation'
                  }
                </Paragraph>

                {uploadResult.hasData && (
                  <Button
                    type="primary"
                    size="large"
                    icon={<RocketOutlined />}
                    onClick={() => onFileUploaded(uploadResult)}
                    style={{ fontSize: '16px', padding: '0 32px' }}
                  >
                    View Dashboard
                  </Button>
                )}
              </div>
            )}

            {error && (
              <Alert
                message="Processing Error"
                description={error}
                type="error"
                showIcon
                style={{ marginTop: '16px' }}
                action={
                  <Button size="small" onClick={() => setError(null)}>
                    Try Again
                  </Button>
                }
              />
            )}
          </Card>

          {/* Supported Formats */}
          <Card 
            title={
              <span style={{ color: isDarkMode ? '#fff' : '#000' }}>
                <FileTextOutlined style={{ marginRight: '8px' }} />
                Supported File Formats
              </span>
            }
            style={{ 
              background: isDarkMode ? '#1f1f1f' : '#fff',
              borderColor: isDarkMode ? '#434343' : '#f0f0f0'
            }}
            headStyle={{ 
              background: isDarkMode ? '#262626' : '#fafafa',
              borderBottomColor: isDarkMode ? '#434343' : '#f0f0f0'
            }}
          >
            <Row gutter={[16, 16]}>
              {supportedFormats.map((format, index) => (
                <Col xs={24} sm={8} key={index}>
                  <div style={{ 
                    padding: '16px', 
                    border: `1px solid ${isDarkMode ? '#434343' : '#f0f0f0'}`,
                    borderRadius: '6px',
                    textAlign: 'center',
                    background: isDarkMode ? '#2a2a2a' : '#fafafa'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      {format.icon}
                    </div>
                    <Text strong style={{ color: isDarkMode ? '#fff' : '#000' }}>
                      {format.type}
                    </Text>
                    <br />
                    <Text style={{ fontSize: '12px', color: isDarkMode ? '#a0a0a0' : '#666' }}>
                      {format.description}
                    </Text>
                    <br />
                    <Text style={{ fontSize: '11px', color: '#fa8c16' }}>
                      Max: {format.maxSize}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;