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
import FunnelChart from './charts/FunnelChart.js';
import WaterfallChart from './charts/WaterfallChart.js';
import HeatmapChart from './charts/HeatmapChart.js';
import CohortChart from './charts/CohortChart.js';
import BulletChart from './charts/BulletChart.js';
import SankeyChart from './charts/SankeyChart.js';
import TreemapChart from './charts/TreemapChart.js';
import RangeChart from './charts/RangeChart.js';
import { KPICard, createKPICard } from './core/KPICard.js';
import { TrendBadge, createTrendBadge } from './core/TrendBadge.js';
import { KPIComparisonCard, createKPIComparisonCard } from './core/KPIComparisonCard.js';
import { LiveWidget, createLiveWidget } from './core/LiveWidget.js';
import { EcommerceSimulator, createEcommerceSimulator } from './core/EcommerceSimulator.js';
import { getSupportedTokens } from './core/CSSTokens.js';
import { COMPARE_COLOR, COLOR_PALETTE, DARK_STYLE, DARK_KPI_COLORS, isDarkMode, getDarkPalette } from './core/defaults.js';
import { deepMerge, formatCompact, formatNumber } from './core/utils.js';
import DataTable from './core/DataTable.js';
import { Breadcrumb } from './core/Breadcrumb.js';
import { DrillDownManager } from './core/DrillDownManager.js';

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
  /**
   * Global design override — merged into all charts (lower priority than user config)
   * Set via NewChart.designOverride = { style: { ... }, options: { ... } }
   * @type {Object|null}
   */
  designOverride: null,

  create(element, config = {}) {
    // Merge design override: defaults < designOverride < user config < CSS tokens
    if (NewChart.designOverride) {
      config = deepMerge(NewChart.designOverride, config);
    }

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
      case 'funnel':
        ChartClass = FunnelChart;
        break;
      case 'waterfall':
        ChartClass = WaterfallChart;
        break;
      case 'heatmap':
        ChartClass = HeatmapChart;
        break;
      case 'cohort':
        ChartClass = CohortChart;
        break;
      case 'bullet':
        ChartClass = BulletChart;
        break;
      case 'sankey':
        ChartClass = SankeyChart;
        break;
      case 'treemap':
        ChartClass = TreemapChart;
        break;
      case 'range':
        ChartClass = RangeChart;
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
  FunnelChart,
  WaterfallChart,
  HeatmapChart,
  CohortChart,
  BulletChart,
  SankeyChart,
  TreemapChart,
  RangeChart,

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
   * KPI Comparison Card component
   */
  KPIComparisonCard,

  /**
   * Create a KPI comparison card (convenience factory)
   */
  kpiComparisonCard: createKPIComparisonCard,

  /**
   * LiveWidget component
   */
  LiveWidget,

  /**
   * Create a live widget (convenience factory)
   * @param {Element|string} element - DOM element or selector
   * @param {Object} config - Widget configuration
   * @returns {LiveWidget} Widget instance
   */
  liveWidget: createLiveWidget,

  /**
   * EcommerceSimulator component
   */
  EcommerceSimulator,

  /**
   * Create an e-commerce simulator (convenience factory)
   * @param {Object} config - Simulator configuration
   * @returns {EcommerceSimulator} Simulator instance
   */
  ecommerceSimulator: createEcommerceSimulator,

  /**
   * Check if dark mode is active for a given theme value
   * @param {string} theme - 'light', 'dark', or 'auto'
   * @returns {boolean}
   */
  isDarkMode
};

// Components not in the object literal above — attach here
NewChart.DataTable = DataTable;
NewChart.Breadcrumb = Breadcrumb;
NewChart.DrillDownManager = DrillDownManager;
NewChart.formatCompact = formatCompact;
NewChart.formatNumber = formatNumber;

// Named exports for tree-shaking
export {
  BarChart,
  PieChart,
  LineChart,
  AreaChart,
  GaugeChart,
  SparklineChart,
  ComboChart,
  ScatterChart,
  NetworkBallChart,
  FunnelChart,
  WaterfallChart,
  HeatmapChart,
  CohortChart,
  BulletChart,
  SankeyChart,
  TreemapChart,
  RangeChart,
  KPICard,
  createKPICard,
  TrendBadge,
  createTrendBadge,
  KPIComparisonCard,
  createKPIComparisonCard,
  LiveWidget,
  createLiveWidget,
  EcommerceSimulator,
  createEcommerceSimulator,
  DataTable,
  Breadcrumb,
  DrillDownManager,
  getSupportedTokens,
  COMPARE_COLOR,
  COLOR_PALETTE,
  DARK_STYLE,
  DARK_KPI_COLORS,
  isDarkMode,
  getDarkPalette,
  deepMerge,
  formatCompact,
  formatNumber
};

// Default export for backwards compatibility
export default NewChart;
