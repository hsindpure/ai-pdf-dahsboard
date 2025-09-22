// backend/services/calculator.js
class Calculator {
  
    calculateKPIs(data, kpiDefinitions) {
      const kpis = [];
      
      kpiDefinitions.forEach(def => {
        try {
          const kpi = this.calculateSingleKPI(data, def);
          if (kpi) {
            kpis.push(kpi);
          }
        } catch (error) {
          console.warn(`Warning calculating KPI ${def.name}:`, error.message);
        }
      });
      
      return kpis;
    }
    
    calculateSingleKPI(data, definition) {
      let value = 0;
      
      switch (definition.calculation.toLowerCase()) {
        case 'sum':
          value = this.calculateSum(data, definition.column);
          break;
          
        case 'avg':
        case 'average':
          value = this.calculateAverage(data, definition.column);
          break;
          
        case 'count':
          value = data.length;
          break;
          
        case 'max':
          value = this.calculateMax(data, definition.column);
          break;
          
        case 'min':
          value = this.calculateMin(data, definition.column);
          break;
          
        default:
          console.warn(`Unknown calculation type: ${definition.calculation}`);
          return null;
      }
      
      return {
        name: definition.name,
        value: value,
        formattedValue: this.formatValue(value, definition.format),
        calculation: definition.calculation,
        column: definition.column,
        format: definition.format
      };
    }
  
    calculateSum(data, column) {
      return data.reduce((sum, row) => {
        const val = parseFloat(row[column]);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
    }
  
    calculateAverage(data, column) {
      const sum = this.calculateSum(data, column);
      const count = data.filter(row => !isNaN(parseFloat(row[column]))).length;
      return count > 0 ? sum / count : 0;
    }
  
    calculateMax(data, column) {
      const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
      return values.length > 0 ? Math.max(...values) : 0;
    }
  
    calculateMin(data, column) {
      const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
      return values.length > 0 ? Math.min(...values) : 0;
    }
    
    formatValue(value, format) {
      if (isNaN(value) || !isFinite(value)) {
        return '0';
      }
      
      switch (format?.toLowerCase()) {
        case 'currency':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
          
        case 'percent':
          return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          }).format(value / 100);
          
        case 'number':
        default:
          if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
          } else {
            return value.toLocaleString();
          }
      }
    }
    
    generateChartConfigs(data, chartDefinitions) {
      const charts = [];
      
      chartDefinitions.forEach((def, index) => {
        try {
          const chartData = this.prepareChartData(data, def);
          if (chartData && chartData.length > 0) {
            charts.push({
              id: `chart_${index}`,
              title: def.title,
              type: def.type,
              data: chartData,
              measures: def.measures,
              dimensions: def.dimensions,
              config: this.generateChartOption(def.type, chartData, def.measures, def.dimensions)
            });
          }
        } catch (error) {
          console.warn(`Warning generating chart ${def.title}:`, error.message);
        }
      });
      
      return charts;
    }
    
    prepareChartData(data, chartDef) {
      const { measures, dimensions, type } = chartDef;
      
      if (!measures || !dimensions || measures.length === 0 || dimensions.length === 0) {
        return data.slice(0, 20); // Return first 20 rows if no aggregation needed
      }
      
      const primaryDimension = dimensions[0];
      const primaryMeasure = measures[0];
      
      // Group data by dimension
      const grouped = this.groupBy(data, primaryDimension);
      
      // Calculate aggregated values
      const chartData = Object.keys(grouped).map(key => {
        const group = grouped[key];
        const dataPoint = { [primaryDimension]: key };
        
        measures.forEach(measure => {
          dataPoint[measure] = this.calculateSum(group, measure);
        });
        
        return dataPoint;
      });
      
      // Sort and limit data points
      return chartData
        .sort((a, b) => (b[primaryMeasure] || 0) - (a[primaryMeasure] || 0))
        .slice(0, 20); // Limit to top 20 for performance
    }
  
    groupBy(data, key) {
      return data.reduce((groups, item) => {
        const group = item[key] || 'Unknown';
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(item);
        return groups;
      }, {});
    }
    
    generateChartOption(type, data, measures, dimensions) {
      const primaryMeasure = measures[0];
      const primaryDimension = dimensions[0];
      
      const baseConfig = {
        data: data,
        margin: { top: 20, right: 30, left: 20, bottom: 5 }
      };
      
      switch (type) {
        case 'bar':
          return {
            ...baseConfig,
            type: 'BarChart',
            dataKey: primaryMeasure,
            xAxisKey: primaryDimension
          };
          
        case 'line':
          return {
            ...baseConfig,
            type: 'LineChart',
            dataKey: primaryMeasure,
            xAxisKey: primaryDimension
          };
          
        case 'area':
          return {
            ...baseConfig,
            type: 'AreaChart',
            dataKey: primaryMeasure,
            xAxisKey: primaryDimension
          };
          
        case 'pie':
          return {
            ...baseConfig,
            type: 'PieChart',
            dataKey: primaryMeasure,
            nameKey: primaryDimension
          };
          
        default:
          return baseConfig;
      }
    }
  }
  
  module.exports = new Calculator();