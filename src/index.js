/**
 * NewChart JS - A modern charting library
 * Main entry point
 */

import BarChart from './charts/BarChart.js';
import PieChart from './charts/PieChart.js';
import LineChart from './charts/LineChart.js';
import AreaChart from './charts/AreaChart.js';
import GaugeChart from './charts/GaugeChart.js';
import SparklineChart from './charts/SparklineChart.js';
import ComboChart from './charts/ComboChart.js';
import ScatterChart from './charts/ScatterChart.js';
import NetworkBallChart from './charts/NetworkBallChart.js';
import { KPICard, createKPICard } from './core/KPICard.js';
import { TrendBadge, createTrendBadge } from './core/TrendBadge.js';
import { getSupportedTokens } from './core/CSSTokens.js';
import { COMPARE_COLOR, COLOR_PALETTE, DARK_STYLE, DARK_KPI_COLORS, isDarkMode, getDarkPalette } from './core/defaults.js';
import DataTable from './core/DataTable.js';

/**
 * Chart factory and namespace
 */
const NewChart = {
  /**
   * Create a new chart
   * @param {Element|string} element - DOM element or selector
   * @param {Object} config - Chart configuration
   * @returns {Chart} Chart instance
   *
   * @example
   * const chart = NewChart.create('#chart', {
   *   type: 'bar',
   *   data: {
   *     labels: ['Jan', 'Feb', 'Mar'],
   *     datasets: [{
   *       label: 'Sales',
   *       values: [100, 200, 150],
   *       color: '#4F46E5'
   *     }]
   *   }
   * });
   */
  create(element, config = {}) {
    const chartType = config.type || 'bar';

    let ChartClass;
    switch (chartType.toLowerCase()) {
      case 'bar':
        ChartClass = BarChart;
        break;
      case 'pie':
        ChartClass = PieChart;
        break;
      case 'line':
        ChartClass = LineChart;
        break;
      case 'area':
        ChartClass = AreaChart;
        break;
      case 'gauge':
        ChartClass = GaugeChart;
        break;
      case 'sparkline':
        ChartClass = SparklineChart;
        break;
      case 'combo':
        ChartClass = ComboChart;
        break;
      case 'scatter':
      case 'bubble':
        ChartClass = ScatterChart;
        break;
      case 'networkball':
        ChartClass = NetworkBallChart;
        break;
      default:
        throw new Error(`Unknown chart type: ${chartType}`);
    }

    return new ChartClass(element, config);
  },

  /**
   * Version string
   */
  version: '0.1.0',

  /**
   * Exported chart classes
   */
  BarChart,
  PieChart,
  LineChart,
  AreaChart,
  GaugeChart,
  SparklineChart,
  ComboChart,
  ScatterChart,
  NetworkBallChart,

  /**
   * KPI Card component
   */
  KPICard,

  /**
   * Create a KPI card (convenience factory)
   * @param {Element|string} element - DOM element or selector
   * @param {Object} config - Card configuration
   * @returns {KPICard} Card instance
   */
  kpiCard: createKPICard,

  /**
   * TrendBadge component
   */
  TrendBadge,

  /**
   * Create a trend badge (convenience factory)
   * @param {Element|string} element - DOM element or selector
   * @param {Object} config - Badge configuration
   * @returns {TrendBadge} Badge instance
   */
  trendBadge: createTrendBadge,

  /**
   * Get list of supported CSS custom property tokens
   * @returns {string[]} Token names
   */
  getSupportedTokens,

  /**
   * Default compare/previous-period color
   */
  COMPARE_COLOR,

  /**
   * Default color palette
   */
  PALETTE: COLOR_PALETTE,

  /**
   * Dark palette (brighter for dark backgrounds)
   */
  DARK_PALETTE: getDarkPalette(),

  /**
   * Dark theme style overrides
   */
  DARK_STYLE,

  /**
   * Dark theme KPI card colors
   */
  DARK_KPI_COLORS,

  /**
   * Check if dark mode is active for a given theme value
   * @param {string} theme - 'light', 'dark', or 'auto'
   * @returns {boolean}
   */
  isDarkMode
};

// DataTable not in the object literal above — attach here
NewChart.DataTable = DataTable;

export default NewChart;
