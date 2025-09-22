// frontend/src/components/LandingPage.js
import React from 'react';
import { Button, Typography, Row, Col, Card, Space, Switch } from 'antd';
import { 
  RocketOutlined, 
  FileTextOutlined, 
  BarChartOutlined, 
  BulbOutlined,
  SunOutlined,
  MoonOutlined,
  EyeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const LandingPage = ({ onGetStarted, onToggleTheme, isDarkMode }) => {
  const features = [
    {
      icon: <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      title: 'Smart Document Processing',
      description: 'Upload PDF documents or images. AI extracts and analyzes numerical data automatically.'
    },
    {
      icon: <BulbOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI identifies patterns and generates meaningful insights from your documents.'
    },
    {
      icon: <BarChartOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />,
      title: 'Interactive Dashboards',
      description: 'Beautiful, responsive charts and KPIs generated automatically from extracted data.'
    }
  ];

  const supportedFormats = [
    { name: 'PDF Documents', icon: '📄', description: 'Financial reports, statements, data sheets' },
    { name: 'PNG Images', icon: '🖼️', description: 'Screenshots of tables, charts, data' },
    { name: 'JPEG Images', icon: '📸', description: 'Photos of documents, printed reports' }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0, color: isDarkMode ? '#fff' : '#000' }}>
            AI Document Dashboard
          </Title>
        </div>
        <Space>
          <SunOutlined style={{ color: isDarkMode ? '#fff' : '#000' }} />
          <Switch checked={isDarkMode} onChange={onToggleTheme} />
          <MoonOutlined style={{ color: isDarkMode ? '#fff' : '#000' }} />
        </Space>
      </div>

      {/* Hero Section */}
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Title level={1} style={{ 
            fontSize: '48px', 
            marginBottom: '24px', 
            color: isDarkMode ? '#fff' : '#000',
            lineHeight: '1.2'
          }}>
            Transform Documents Into
            <br />
            <span style={{ color: '#1890ff' }}>Smart Dashboards</span>
          </Title>
          
          <Paragraph style={{ 
            fontSize: '20px', 
            marginBottom: '40px', 
            maxWidth: '600px', 
            margin: '0 auto 40px',
            color: isDarkMode ? '#a0a0a0' : '#666',
            lineHeight: '1.6'
          }}>
            Upload PDF documents or images with numerical data. Our AI extracts information 
            and creates interactive dashboards automatically.
          </Paragraph>

          <Space size="large">
            <Button 
              type="primary" 
              size="large" 
              icon={<RocketOutlined />}
              onClick={onGetStarted}
              style={{ height: '50px', fontSize: '16px', padding: '0 32px' }}
            >
              Get Started Free
            </Button>
            
            <Button 
              size="large" 
              icon={<EyeOutlined />}
              style={{ height: '50px', fontSize: '16px', padding: '0 32px' }}
            >
              View Demo
            </Button>
          </Space>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: '80px 24px', background: isDarkMode ? '#1f1f1f' : '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ 
            textAlign: 'center', 
            marginBottom: '60px', 
            color: isDarkMode ? '#fff' : '#000' 
          }}>
            How It Works
          </Title>
          
          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} md={8} key={index}>
                <Card 
                  hoverable
                  style={{ 
                    height: '100%',
                    background: isDarkMode ? '#2a2a2a' : '#fff',
                    borderColor: isDarkMode ? '#434343' : '#f0f0f0',
                    textAlign: 'center'
                  }}
                  bodyStyle={{ padding: '32px 24px' }}
                >
                  <div style={{ marginBottom: '20px' }}>
                    {feature.icon}
                  </div>
                  <Title level={4} style={{ 
                    marginBottom: '16px', 
                    color: isDarkMode ? '#fff' : '#000' 
                  }}>
                    {feature.title}
                  </Title>
                  <Paragraph style={{ 
                    color: isDarkMode ? '#a0a0a0' : '#666', 
                    marginBottom: 0,
                    lineHeight: '1.6'
                  }}>
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Supported Formats Section */}
      <div style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Title level={2} style={{ 
            textAlign: 'center', 
            marginBottom: '24px', 
            color: isDarkMode ? '#fff' : '#000' 
          }}>
            Supported File Formats
          </Title>
          <Paragraph style={{ 
            textAlign: 'center',
            fontSize: '16px', 
            marginBottom: '48px',
            color: isDarkMode ? '#a0a0a0' : '#666'
          }}>
            Upload documents and images containing numerical or tabular data
          </Paragraph>

          <Row gutter={[24, 24]}>
            {supportedFormats.map((format, index) => (
              <Col xs={24} sm={8} key={index}>
                <Card 
                  hoverable
                  style={{ 
                    background: isDarkMode ? '#2a2a2a' : '#fff',
                    borderColor: isDarkMode ? '#434343' : '#f0f0f0',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>
                    {format.icon}
                  </div>
                  <Title level={5} style={{ 
                    marginBottom: '8px', 
                    color: isDarkMode ? '#fff' : '#000' 
                  }}>
                    {format.name}
                  </Title>
                  <Paragraph style={{ 
                    fontSize: '14px', 
                    color: isDarkMode ? '#a0a0a0' : '#666', 
                    marginBottom: 0 
                  }}>
                    {format.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Benefits Section */}
      <div style={{ 
        padding: '80px 24px', 
        background: isDarkMode ? '#1f1f1f' : '#fff'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <Title level={2} style={{ 
            marginBottom: '48px', 
            color: isDarkMode ? '#fff' : '#000' 
          }}>
            Why Choose AI Document Dashboard?
          </Title>

          <Row gutter={[32, 32]}>
            <Col xs={24} sm={12}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <CheckCircleOutlined style={{ 
                  fontSize: '24px', 
                  color: '#52c41a',
                  marginTop: '4px'
                }} />
                <div style={{ textAlign: 'left' }}>
                  <Title level={5} style={{ 
                    marginBottom: '8px', 
                    color: isDarkMode ? '#fff' : '#000' 
                  }}>
                    No Manual Data Entry
                  </Title>
                  <Paragraph style={{ 
                    color: isDarkMode ? '#a0a0a0' : '#666',
                    marginBottom: 0
                  }}>
                    AI automatically extracts and structures data from your documents
                  </Paragraph>
                </div>
              </div>
            </Col>
            
            <Col xs={24} sm={12}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <CheckCircleOutlined style={{ 
                  fontSize: '24px', 
                  color: '#52c41a',
                  marginTop: '4px'
                }} />
                <div style={{ textAlign: 'left' }}>
                  <Title level={5} style={{ 
                    marginBottom: '8px', 
                    color: isDarkMode ? '#fff' : '#000' 
                  }}>
                    Instant Insights
                  </Title>
                  <Paragraph style={{ 
                    color: isDarkMode ? '#a0a0a0' : '#666',
                    marginBottom: 0
                  }}>
                    Get meaningful visualizations and KPIs in seconds
                  </Paragraph>
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <CheckCircleOutlined style={{ 
                  fontSize: '24px', 
                  color: '#52c41a',
                  marginTop: '4px'
                }} />
                <div style={{ textAlign: 'left' }}>
                  <Title level={5} style={{ 
                    marginBottom: '8px', 
                    color: isDarkMode ? '#fff' : '#000' 
                  }}>
                    Smart Data Detection
                  </Title>
                  <Paragraph style={{ 
                    color: isDarkMode ? '#a0a0a0' : '#666',
                    marginBottom: 0
                  }}>
                    Only processes documents with suitable numerical data
                  </Paragraph>
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <CheckCircleOutlined style={{ 
                  fontSize: '24px', 
                  color: '#52c41a',
                  marginTop: '4px'
                }} />
                <div style={{ textAlign: 'left' }}>
                  <Title level={5} style={{ 
                    marginBottom: '8px', 
                    color: isDarkMode ? '#fff' : '#000' 
                  }}>
                    Professional Results
                  </Title>
                  <Paragraph style={{ 
                    color: isDarkMode ? '#a0a0a0' : '#666',
                    marginBottom: 0
                  }}>
                    Beautiful, interactive dashboards ready for presentations
                  </Paragraph>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        padding: '80px 24px', 
        background: isDarkMode ? '#001529' : '#1890ff',
        textAlign: 'center'
      }}>
        <Title level={2} style={{ color: '#fff', marginBottom: '24px' }}>
          Ready to Transform Your Documents?
        </Title>
        <Paragraph style={{ fontSize: '18px', color: '#fff', marginBottom: '40px' }}>
          Upload your first document and see the magic of AI-powered data extraction.
        </Paragraph>
        <Button 
          type="primary" 
          size="large"
          ghost
          icon={<RocketOutlined />}
          onClick={onGetStarted}
          style={{ 
            height: '50px', 
            fontSize: '16px', 
            padding: '0 32px',
            borderColor: '#fff',
            color: '#fff'
          }}
        >
          Start Building Now
        </Button>
      </div>

      {/* Footer */}
      <div style={{ 
        padding: '40px 24px', 
        textAlign: 'center',
        background: isDarkMode ? '#141414' : '#f0f2f5',
        borderTop: `1px solid ${isDarkMode ? '#434343' : '#d9d9d9'}`
      }}>
        <Paragraph style={{ marginBottom: 0, color: isDarkMode ? '#a0a0a0' : '#666' }}>
          AI Document Dashboard - Transform your documents into insights
        </Paragraph>
      </div>
    </div>
  );
};

export default LandingPage;