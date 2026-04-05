/**
 * KPI Card component
 *
 * A standalone, config-driven KPI card with:
 * - Label, value, suffix/prefix
 * - Change badge (up/down arrow with percentage)
 * - Previous period value
 * - Inline sparkline (line, area, or bar via SparklineChart)
 * - Progress bar with semantic color (green/yellow/red vs target)
 * - Status dot indicator
 * - Click handler
 * - update() for reactive changes
 *
 * Usage:
 *   const card = NewChart.KPICard(element, {
 *     label: 'Omsättning',
 *     value: 38920000,
 *     previous: 32410000,
 *     suffix: ' kr',
 *     target: 42000000,
 *     sparkline: { values: [2850,3120,2960,...], color: '#4c6ef5' },
 *     onClick: () => { ... }
 *   });
 */

import SparklineChart from '../charts/SparklineChart.js';
import { formatNumber } from './utils.js';

/**
 * Default KPI card configuration
 */
const KPI_DEFAULTS = {
  label: '',
  value: 0,
  previous: null,
  target: null,
  suffix: '',
  prefix: '',
  decimals: 0,
  formatValue: null,
  formatPrevious: null,
  sparkline: null,
  active: false,
  onClick: null,
  thresholds: { good: 1.0, warning: 0.9 },
  colors: {
    up: '#099268',
    upBg: '#c3fae8',
    down: '#c92a2a',
    downBg: '#ffc9c9',
    good: '#0ca678',
    warning: '#f08c00',
    danger: '#e03131',
    label: '#8993a4',
    value: '#172b4d',
    previous: '#b3bac5',
    border: '#dfe1e6',
    borderActive: '#4c6ef5',
    surface: '#ffffff',
    progressTrack: '#ebecf0'
  },
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  monoFont: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace"
};

export class KPICard {
  /**
   * Create a KPI card
   * @param {Element|string} element - DOM element or CSS selector
   * @param {Object} config - Card configuration
   */
  constructor(element, config = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;

    if (!this.element) {
      throw new Error('KPICard element not found');
    }

    this.config = { ...KPI_DEFAULTS, ...config };
    if (config.colors) {
      this.config.colors = { ...KPI_DEFAULTS.colors, ...config.colors };
    }
    if (config.thresholds) {
      this.config.thresholds = { ...KPI_DEFAULTS.thresholds, ...config.thresholds };
    }

    this.sparklineInstance = null;
    this._clickHandler = null;

    this.render();
  }

  /**
   * Format the main value display
   * @param {number} value - Value to format
   * @returns {string} Formatted value string
   */
  _formatValue(value) {
    if (typeof this.config.formatValue === 'function') {
      return this.config.formatValue(value);
    }
    return this.config.prefix + this._autoFormat(value) + this.config.suffix;
  }

  /**
   * Format the previous value display
   * @param {number} value - Previous period value
   * @returns {string} Formatted string
   */
  _formatPrevious(value) {
    if (typeof this.config.formatPrevious === 'function') {
      return this.config.formatPrevious(value);
    }
    return 'fg. ' + this.config.prefix + this._autoFormat(value) + this.config.suffix;
  }

  /**
   * Auto-format a number with smart abbreviation
   * @param {number} n - Number to format
   * @returns {string} Formatted string
   */
  _autoFormat(n) {
    if (typeof n !== 'number') return String(n);
    if (this.config.decimals > 0) {
      return formatNumber(n, this.config.decimals);
    }
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e4) return Math.round(n / 1e3) + 'k';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return formatNumber(n, this.config.decimals);
  }

  /**
   * Calculate percentage change
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {number} Percentage change
   */
  _pctChange(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  /**
   * Get status color based on value vs target
   * @returns {string} Status: 'good', 'warning', or 'danger'
   */
  _getStatus() {
    const { value, target, thresholds } = this.config;
    if (target == null) return null;
    const ratio = value / target;
    if (ratio >= thresholds.good) return 'good';
    if (ratio >= thresholds.warning) return 'warning';
    return 'danger';
  }

  /**
   * Render the KPI card
   */
  render() {
    const { config } = this;
    const { colors } = config;
    const el = this.element;

    // Clean up previous render
    if (this._clickHandler) {
      el.removeEventListener('click', this._clickHandler);
      this._clickHandler = null;
    }
    if (this.sparklineInstance) {
      this.sparklineInstance.destroy();
      this.sparklineInstance = null;
    }
    el.innerHTML = '';

    // Root styles
    Object.assign(el.style, {
      padding: '14px 16px',
      background: colors.surface,
      borderRadius: '8px',
      border: `1.5px solid ${config.active ? colors.borderActive : colors.border}`,
      cursor: config.onClick ? 'pointer' : 'default',
      transition: 'all 0.12s',
      boxShadow: config.active
        ? `0 0 0 3px rgba(76,110,245,0.09), 0 4px 12px rgba(0,0,0,0.08)`
        : '0 1px 3px rgba(0,0,0,0.06)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: config.font,
      boxSizing: 'border-box'
    });

    // Header row (label + status dot)
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '4px'
    });

    const label = document.createElement('div');
    label.textContent = config.label;
    Object.assign(label.style, {
      fontSize: '10px',
      fontWeight: '600',
      color: colors.label,
      textTransform: 'uppercase',
      letterSpacing: '0.7px'
    });
    label.className = 'nc-kpi-label';
    header.appendChild(label);

    // Status dot
    const status = this._getStatus();
    if (status) {
      const dot = document.createElement('span');
      Object.assign(dot.style, {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        display: 'inline-block',
        flexShrink: '0',
        background: colors[status]
      });
      dot.className = 'nc-kpi-status';
      header.appendChild(dot);
    }

    el.appendChild(header);

    // Value row (value + change badge)
    const valueRow = document.createElement('div');
    Object.assign(valueRow.style, {
      display: 'flex',
      alignItems: 'baseline',
      gap: '6px',
      marginBottom: '2px',
      flexWrap: 'wrap'
    });
    valueRow.className = 'nc-kpi-value-row';

    const valueEl = document.createElement('span');
    valueEl.textContent = this._formatValue(config.value);
    Object.assign(valueEl.style, {
      fontSize: '22px',
      fontWeight: '700',
      color: colors.value,
      fontFamily: config.monoFont,
      letterSpacing: '-0.5px'
    });
    valueEl.className = 'nc-kpi-value';
    valueRow.appendChild(valueEl);

    // Change badge
    if (config.previous != null) {
      const change = this._pctChange(config.value, config.previous);
      const isUp = change >= 0;

      const badge = document.createElement('span');
      badge.innerHTML = `${isUp ? '&#9650;' : '&#9660;'} ${Math.abs(change).toFixed(1)}%`;
      Object.assign(badge.style, {
        fontSize: '10px',
        fontWeight: '600',
        fontFamily: config.monoFont,
        borderRadius: '3px',
        padding: '1px 5px',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        color: isUp ? colors.up : colors.down,
        background: isUp ? colors.upBg : colors.downBg
      });
      badge.className = 'nc-kpi-badge';
      valueRow.appendChild(badge);
    }

    el.appendChild(valueRow);

    // Footer row (previous value + sparkline)
    const footer = document.createElement('div');
    Object.assign(footer.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: '8px'
    });
    footer.className = 'nc-kpi-footer';

    if (config.previous != null) {
      const prev = document.createElement('span');
      prev.textContent = this._formatPrevious(config.previous);
      Object.assign(prev.style, {
        fontSize: '10px',
        color: colors.previous,
        fontFamily: config.monoFont
      });
      prev.className = 'nc-kpi-previous';
      footer.appendChild(prev);
    }

    // Sparkline container
    if (config.sparkline) {
      const sparkContainer = document.createElement('div');
      Object.assign(sparkContainer.style, {
        width: (config.sparkline.width || 64) + 'px',
        height: (config.sparkline.height || 22) + 'px',
        flexShrink: '0'
      });
      sparkContainer.className = 'nc-kpi-sparkline';
      footer.appendChild(sparkContainer);

      // Defer sparkline creation so the container is in DOM
      this._sparkContainer = sparkContainer;
    }

    el.appendChild(footer);

    // Progress bar
    if (config.target != null) {
      const pct = Math.min(100, (config.value / config.target) * 100);
      const progressColor = colors[status] || colors.good;

      const track = document.createElement('div');
      Object.assign(track.style, {
        marginTop: '6px',
        height: '3px',
        background: colors.progressTrack,
        borderRadius: '2px',
        overflow: 'hidden'
      });
      track.className = 'nc-kpi-progress';

      const fill = document.createElement('div');
      Object.assign(fill.style, {
        height: '100%',
        borderRadius: '2px',
        width: pct + '%',
        background: progressColor,
        transition: 'width 0.4s'
      });
      fill.className = 'nc-kpi-progress-fill';
      track.appendChild(fill);

      el.appendChild(track);
    }

    // Click handler
    if (typeof config.onClick === 'function') {
      this._clickHandler = (e) => config.onClick({ element: el, config, event: e });
      el.addEventListener('click', this._clickHandler);

      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.boxShadow = config.active
          ? '0 0 0 3px rgba(76,110,245,0.09), 0 4px 12px rgba(0,0,0,0.08)'
          : '0 1px 3px rgba(0,0,0,0.06)';
      });
    }

    // Create sparkline after DOM insertion
    if (config.sparkline && this._sparkContainer) {
      requestAnimationFrame(() => {
        this._createSparkline();
      });
    }
  }

  /**
   * Create the sparkline chart instance
   */
  _createSparkline() {
    const { sparkline } = this.config;
    if (!sparkline?.values?.length || !this._sparkContainer) return;

    try {
      this.sparklineInstance = new SparklineChart(this._sparkContainer, {
        data: {
          datasets: [{
            values: sparkline.values,
            color: sparkline.color || this.config.colors.value
          }]
        },
        options: {
          variant: sparkline.variant || 'area',
          highlightLast: sparkline.highlightLast !== false,
          referenceLine: sparkline.referenceLine ?? null,
          responsive: false
        },
        style: {
          animation: { duration: sparkline.animated !== false ? 400 : 0 },
          background: 'transparent'
        }
      });
    } catch (e) {
      // Sparkline creation can fail in test environments
    }
  }

  /**
   * Update card with new config (partial merge)
   * @param {Object} config - Partial config to merge
   */
  update(config = {}) {
    if (config.colors) {
      this.config.colors = { ...this.config.colors, ...config.colors };
      delete config.colors;
    }
    if (config.thresholds) {
      this.config.thresholds = { ...this.config.thresholds, ...config.thresholds };
      delete config.thresholds;
    }
    Object.assign(this.config, config);
    this.render();
  }

  /**
   * Set active state
   * @param {boolean} active - Whether card is active
   */
  setActive(active) {
    this.update({ active });
  }

  /**
   * Destroy the card and clean up
   */
  destroy() {
    if (this._clickHandler) {
      this.element.removeEventListener('click', this._clickHandler);
      this._clickHandler = null;
    }
    if (this.sparklineInstance) {
      this.sparklineInstance.destroy();
      this.sparklineInstance = null;
    }
    this.element.innerHTML = '';
  }
}

/**
 * Factory function for creating KPI cards
 * @param {Element|string} element - DOM element or selector
 * @param {Object} config - Card configuration
 * @returns {KPICard} Card instance
 */
export function createKPICard(element, config) {
  return new KPICard(element, config);
}

export default KPICard;
