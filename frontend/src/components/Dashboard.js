// frontend/src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Typography, 
  Button, 
  Row, 
  Col, 
  Card, 
  Space, 
  Statistic, 
  Switch,
  Spin,
  Alert,
  message,
  Tag
} from 'antd';
import { 
  ArrowLeftOutlined, 
  DownloadOutlined,
  SunOutlined,
  MoonOutlined,
  BarChartOutlined,
  FileAddOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import ChartContainer from './ChartContainer';
import { apiService } from '../services/api';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const Dashboard = ({ sessionId, fileInfo, onBack, onNewFile, onToggleTheme, isDarkMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (sessionId) {
      loadDashboard();
    }
  }, [sessionId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading dashboard for session:', sessionId);

      const result = await apiService.generateDashboard(sessionId);
      
      if (result.success) {
        setDashboardData(result.dashboard);
        message.success('Dashboard loaded successfully!');
      } else {
        throw new Error(result.message || 'Failed to load dashboard');
      }

    } catch (error) {
      console.error('Dashboard loading error:', error);
      setError(error.message || 'Failed to load dashboard');
      message.error('Failed to load dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportDashboard = () => {
    try {
      const exportData = {
        ...dashboardData,
        metadata: {
          exportDate: new Date().toISOString(),
          fileName: fileInfo?.fileName,
          sessionId: sessionId
        }
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-${fileInfo?.fileName || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      message.success('Dashboard exported successfully!');
    } catch (error) {
      message.error('Failed to export dashboard');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: isDarkMode ? '#141414' : '#f0f2f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: '16px', color: isDarkMode ? '#fff' : '#000' }}>
            Generating your AI dashboard...
          </Title>
          <Text style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>
            AI is creating intelligent visualizations from your document data
          </Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: isDarkMode ? '#141414' : '#f0f2f5',
        padding: '24px'
      }}>
        <Alert
          message="Dashboard Error"
          description={error}
          type="error"
          showIcon
          style={{ maxWidth: '600px' }}
          action={
            <Space>
              <Button size="small" onClick={loadDashboard}>
                Retry
              </Button>
              <Button size="small" onClick={onBack}>
                Back to Upload
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: isDarkMode ? '#141414' : '#f0f2f5' }}>
      {/* Header */}
      <Header style={{ 
        background: isDarkMode ? '#001529' : '#fff',
        borderBottom: `1px solid ${isDarkMode ? '#434343' : '#f0f0f0'}`,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
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
            <div>
              <Title level={4} style={{ margin: 0, color: isDarkMode ? '#fff' : '#000' }}>
                {fileInfo?.fileName || 'AI Dashboard'}
              </Title>
              <Text style={{ fontSize: '12px', color: isDarkMode ? '#a0a0a0' : '#666' }}>
                Generated from document analysis
              </Text>
            </div>
          </div>
        </div>

        <Space>
          <Button 
            icon={<ReloadOutlined />}
            onClick={loadDashboard}
            title="Refresh Dashboard"
          >
            Refresh
          </Button>
          
          <Button 
            icon={<DownloadOutlined />}
            onClick={exportDashboard}
          >
            Export
          </Button>
          
          <Button 
            icon={<FileAddOutlined />}
            onClick={onNewFile}
            type="primary"
          >
            New Document
          </Button>

          <div style={{ 
            borderLeft: `1px solid ${isDarkMode ? '#434343' : '#f0f0f0'}`, 
            paddingLeft: '16px',
            marginLeft: '8px'
          }}>
            <Space>
              <SunOutlined style={{ color: isDarkMode ? '#fff' : '#000' }} />
              <Switch checked={isDarkMode} onChange={onToggleTheme} />
              <MoonOutlined style={{ color: isDarkMode ? '#fff' : '#000' }} />
            </Space>
          </div>
        </Space>
      </Header>

      {/* Content */}
      <Content style={{ padding: '24px' }}>
        {dashboardData && (
          <>
            {/* Data Info Banner */}
            {dashboardData.dataInfo && (
              <Alert
                message={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      Dashboard generated from {dashboardData.dataInfo.totalRecords} data records 
                      extracted via AI analysis
                    </span>
                    <Tag color="blue">
                      Confidence: {dashboardData.dataInfo.confidence}
                    </Tag>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: '24px' }}
              />
            )}

            {/* Summary */}
            {dashboardData.summary && (
              <Card 
                style={{ 
                  marginBottom: '24px',
                  background: isDarkMode ? '#1f1f1f' : '#fff',
                  borderColor: isDarkMode ? '#434343' : '#f0f0f0'
                }}
              >
                <Title level={5} style={{ color: isDarkMode ? '#fff' : '#000', marginBottom: '12px' }}>
                  Dashboard Summary
                </Title>
                <Paragraph style={{ color: isDarkMode ? '#a0a0a0' : '#666', marginBottom: 0 }}>
                  {dashboardData.summary}
                </Paragraph>
              </Card>
            )}

            {/* KPI Cards */}
            {dashboardData.kpis && dashboardData.kpis.length > 0 && (
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {dashboardData.kpis.map((kpi, index) => (
                  <Col xs={24} sm={12} lg={6} key={index}>
                    <Card 
                      size="small"
                      style={{ 
                        background: isDarkMode ? '#1f1f1f' : '#fff',
                        borderColor: isDarkMode ? '#434343' : '#f0f0f0'
                      }}
                      hoverable
                    >
                      <Statistic
                        title={
                          <span style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>
                            {kpi.name}
                          </span>
                        }
                        value={kpi.formattedValue}
                        valueStyle={{ 
                          color: isDarkMode ? '#fff' : '#000',
                          fontSize: '24px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Text style={{ 
                        fontSize: '11px', 
                        color: isDarkMode ? '#a0a0a0' : '#999'
                      }}>
                        {kpi.calculation} of {kpi.column}
                      </Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            {/* Charts */}
            {dashboardData.charts && dashboardData.charts.length > 0 && (
              <Row gutter={[16, 16]}>
                {dashboardData.charts.map((chart, index) => (
                  <Col xs={24} lg={12} key={index}>
                    <Card 
                      title={
                        <span style={{ color: isDarkMode ? '#fff' : '#000' }}>
                          {chart.title}
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
                      hoverable
                    >
                      <ChartContainer 
                        chart={chart}
                        isDarkMode={isDarkMode}
                        height={300}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            {/* Insights */}
            {dashboardData.insights && dashboardData.insights.length > 0 && (
              <Card 
                title={
                  <span style={{ color: isDarkMode ? '#fff' : '#000' }}>
                    AI Insights
                  </span>
                }
                style={{ 
                  marginTop: '24px',
                  background: isDarkMode ? '#1f1f1f' : '#fff',
                  borderColor: isDarkMode ? '#434343' : '#f0f0f0'
                }}
                headStyle={{ 
                  background: isDarkMode ? '#262626' : '#fafafa',
                  borderBottomColor: isDarkMode ? '#434343' : '#f0f0f0'
                }}
              >
                <ul style={{ 
                  color: isDarkMode ? '#a0a0a0' : '#666',
                  marginBottom: 0,
                  paddingLeft: '20px'
                }}>
                  {dashboardData.insights.map((insight, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      {insight}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Empty State */}
            {(!dashboardData.kpis || dashboardData.kpis.length === 0) && 
             (!dashboardData.charts || dashboardData.charts.length === 0) && (
              <Card style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                background: isDarkMode ? '#1f1f1f' : '#fff',
                borderColor: isDarkMode ? '#434343' : '#f0f0f0'
              }}>
                <BarChartOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Title level={4} style={{ color: isDarkMode ? '#fff' : '#000' }}>
                  No Dashboard Data Available
                </Title>
                <Text style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>
                  The AI analysis did not find suitable data for dashboard creation
                </Text>
              </Card>
            )}
          </>
        )}
      </Content>
    </Layout>
  );
};

export default Dashboard;