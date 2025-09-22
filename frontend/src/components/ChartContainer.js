// frontend/src/components/ChartContainer.js
import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Empty } from 'antd';

const ChartContainer = ({ chart, isDarkMode, height = 300 }) => {
  if (!chart || !chart.data || chart.data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty 
          description="No data available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}
        />
      </div>
    );
  }

  const { type, data, config } = chart;
  
  // Color palette for charts
  const colors = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1', '#eb2f96'];
  
  // Theme-aware colors
  const axisColor = isDarkMode ? '#a0a0a0' : '#666';
  const gridColor = isDarkMode ? '#434343' : '#f0f0f0';
  const tooltipBg = isDarkMode ? '#262626' : '#fff';
  const tooltipBorder = isDarkMode ? '#434343' : '#d9d9d9';

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: tooltipBg,
          border: `1px solid ${tooltipBorder}`,
          borderRadius: '6px',
          padding: '12px',
          boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12)'
        }}>
          <p style={{ 
            color: isDarkMode ? '#fff' : '#000', 
            margin: '0 0 8px 0',
            fontWeight: 'bold'
          }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              color: entry.color, 
              margin: '4px 0',
              fontSize: '14px'
            }}>
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const commonProps = {
    data,
    margin: config?.margin || { top: 20, right: 30, left: 20, bottom: 5 }
  };

  const renderChart = () => {
    switch (type.toLowerCase()) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey={config?.xAxisKey} 
              tick={{ fill: axisColor, fontSize: 12 }}
            />
            <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {chart.measures?.map((measure, index) => (
              <Bar 
                key={measure}
                dataKey={measure} 
                fill={colors[index % colors.length]}
                name={measure.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey={config?.xAxisKey} 
              tick={{ fill: axisColor, fontSize: 12 }}
            />
            <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {chart.measures?.map((measure, index) => (
              <Line 
                key={measure}
                type="monotone"
                dataKey={measure} 
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                name={measure.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey={config?.xAxisKey} 
              tick={{ fill: axisColor, fontSize: 12 }}
            />
            <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {chart.measures?.map((measure, index) => (
              <Area 
                key={measure}
                type="monotone"
                dataKey={measure} 
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
                name={measure.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={Math.min(height * 0.35, 120)}
              fill="#8884d8"
              dataKey={config?.dataKey}
              nameKey={config?.nameKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        );

      default:
        return (
          <div style={{ 
            height, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: isDarkMode ? '#a0a0a0' : '#666'
          }}>
            <Empty 
              description={`Chart type "${type}" not supported`}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        );
    }
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartContainer;