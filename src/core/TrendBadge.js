/**
 * TrendBadge component
 *
 * A lightweight, inline trend indicator with optional sparkline.
 * Designed for embedding in tables, toolbars, headers, and KPI rows.
 *
 * Three display variants:
 * - compact: Just the change chip (▲ 12.3%)
 * - value:   Formatted value + change chip (38.9k ▲ 12.3%)
 * - sparkline: Value + change chip + inline sparkline
 *
 * Usage:
 *   const badge = NewChart.trendBadge(element, {
 *     value: 38920,
 *     previous: 32410,
 *     suffix: ' kr',
 *     sparkline: { values: [28, 31, 29, 34, 38] }
 *   });
 */

import SparklineChart from '../charts/SparklineChart.js';
import { formatNumber, formatCompact } from './utils.js';
import { isDarkMode, DARK_KPI_COLORS } from './defaults.js';

/**
 * Default TrendBadge configuration
 */
const BADGE_DEFAULTS = {
  value: null,
  previous: null,
  change: null,
  suffix: '',
  prefix: '',
  decimals: 0,
  formatValue: null,
  invertColor: false,
  size: 'md',
  sparkline: null,
  theme: 'light',
  colors: {
    up: '#099268',
    upBg: '#c3fae8',
    down: '#c92a2a',
    downBg: '#ffc9c9',
    neutral: '#6b7280',
    neutralBg: '#f3f4f6',
    value: '#172b4d',
    surface: 'transparent'
  },
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  monoFont: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace"
};

/**
 * Dark mode color overrides for TrendBadge
 */
const DARK_BADGE_COLORS = {
  up: DARK_KPI_COLORS.up,
  upBg: DARK_KPI_COLORS.upBg,
  down: DARK_KPI_COLORS.down,
  downBg: DARK_KPI_COLORS.downBg,
  neutral: '#6b7280',
  neutralBg: 'rgba(107, 114, 128, 0.15)',
  value: '#e0e2e7',
  surface: 'transparent'
};

/**
 * Size presets: fontSize, chipFontSize, chipPadding, gap, sparkline width/height
 */
const SIZE_MAP = {
  sm: { fontSize: 12, chipFontSize: 9, chipPad: '1px 4px', gap: '4px', sparkW: 48, sparkH: 16 },
  md: { fontSize: 14, chipFontSize: 10, chipPad: '2px 6px', gap: '6px', sparkW: 64, sparkH: 20 },
  lg: { fontSize: 18, chipFontSize: 11, chipPad: '2px 7px', gap: '8px', sparkW: 80, sparkH: 24 }
};

export class TrendBadge {
  /**
   * Create a TrendBadge
   * @param {Element|string} element - DOM element or CSS selector
   * @param {Object} config - Badge configuration
   */
  constructor(element, config = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;

    if (!this.element) {
      throw new Error('TrendBadge: element not found');
    }

    this.config = { ...BADGE_DEFAULTS, ...config };

    this._dark = isDarkMode(config.theme);
    const baseColors = this._dark
      ? { ...BADGE_DEFAULTS.colors, ...DARK_BADGE_COLORS }
      : BADGE_DEFAULTS.colors;
    this.config.colors = { ...baseColors, ...(config.colors || {}) };

    this.sparklineInstance = null;

    this.render();
  }

  /**
   * Calculate percentage change between current and previous values
   * @returns {number|null} Change percentage, or null if not calculable
   */
  _getChange() {
    if (this.config.change != null) return this.config.change;
    const { value, previous } = this.config;
    if (value == null || previous == null || previous === 0) return null;
    return ((value - previous) / Math.abs(previous)) * 100;
  }

  /**
   * Format the display value with auto-abbreviation
   * @param {number} n - Number to format
   * @returns {string} Formatted value
   */
  _formatValue(n) {
    if (typeof this.config.formatValue === 'function') {
      return this.config.formatValue(n);
    }
    if (typeof n !== 'number') return String(n);

    let formatted;
    if (this.config.numberFormat === 'full') {
      formatted = formatNumber(n, this.config.decimals);
    } else {
      formatted = formatCompact(n, this.config.decimals > 0 ? this.config.decimals : 1);
    }

    return this.config.prefix + formatted + this.config.suffix;
  }

  /**
   * Render the badge into the target element
   */
  render() {
    const { config } = this;
    const { colors } = config;
    const sizes = SIZE_MAP[config.size] || SIZE_MAP.md;
    const el = this.element;

    // Clean up
    if (this.sparklineInstance) {
      this.sparklineInstance.destroy();
      this.sparklineInstance = null;
    }
    el.innerHTML = '';

    // Root container — inline-flex so it flows with text
    Object.assign(el.style, {
      display: 'inline-flex',
      alignItems: 'center',
      gap: sizes.gap,
      fontFamily: config.font,
      background: colors.surface,
      verticalAlign: 'middle',
      lineHeight: '1'
    });

    // Value label (only if value is provided and not compact-only)
    if (config.value != null) {
      const valueEl = document.createElement('span');
      valueEl.textContent = this._formatValue(config.value);
      Object.assign(valueEl.style, {
        fontSize: sizes.fontSize + 'px',
        fontWeight: '600',
        color: colors.value,
        fontFamily: config.monoFont,
        whiteSpace: 'nowrap'
      });
      valueEl.className = 'nc-trend-value';
      el.appendChild(valueEl);
    }

    // Change chip
    const change = this._getChange();
    if (change != null) {
      const isUp = change > 0;
      const isNeutral = change === 0;
      const isPositive = config.invertColor ? !isUp : isUp;

      let chipColor, chipBg;
      if (isNeutral) {
        chipColor = colors.neutral;
        chipBg = colors.neutralBg;
      } else if (isPositive) {
        chipColor = colors.up;
        chipBg = colors.upBg;
      } else {
        chipColor = colors.down;
        chipBg = colors.downBg;
      }

      const arrow = isNeutral ? '–' : isUp ? '▲' : '▼';

      const chip = document.createElement('span');
      chip.textContent = `${arrow} ${Math.abs(change).toFixed(1)}%`;
      Object.assign(chip.style, {
        fontSize: sizes.chipFontSize + 'px',
        fontWeight: '600',
        fontFamily: config.monoFont,
        borderRadius: '3px',
        padding: sizes.chipPad,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        color: chipColor,
        background: chipBg
      });
      chip.className = 'nc-trend-chip';
      el.appendChild(chip);
    }

    // Sparkline
    if (config.sparkline) {
      const sparkContainer = document.createElement('div');
      Object.assign(sparkContainer.style, {
        width: (config.sparkline.width || sizes.sparkW) + 'px',
        height: (config.sparkline.height || sizes.sparkH) + 'px',
        flexShrink: '0'
      });
      sparkContainer.className = 'nc-trend-sparkline';
      el.appendChild(sparkContainer);

      this._sparkContainer = sparkContainer;
      requestAnimationFrame(() => this._createSparkline());
    }
  }

  /**
   * Create the inline sparkline chart
   */
  _createSparkline() {
    const { sparkline, colors } = this.config;
    if (!sparkline?.values?.length || !this._sparkContainer) return;

    try {
      this.sparklineInstance = new SparklineChart(this._sparkContainer, {
        data: {
          datasets: [{
            values: sparkline.values,
            color: sparkline.color || colors.value
          }]
        },
        options: {
          variant: sparkline.variant || 'area',
          highlightLast: sparkline.highlightLast !== false,
          referenceLine: sparkline.referenceLine ?? null,
          responsive: false,
          theme: this.config.theme
        },
        style: {
          animation: { duration: sparkline.animated !== false ? 400 : 0 },
          background: 'transparent'
        }
      });
    } catch (e) {
      // Sparkline creation can fail in test/SSR environments
    }
  }

  /**
   * Update badge with partial config merge
   * @param {Object} config - Partial config to merge
   */
  update(config = {}) {
    if (config.colors) {
      this.config.colors = { ...this.config.colors, ...config.colors };
      delete config.colors;
    }
    Object.assign(this.config, config);
    this.render();
  }

  /**
   * Destroy the badge and clean up
   */
  destroy() {
    if (this.sparklineInstance) {
      this.sparklineInstance.destroy();
      this.sparklineInstance = null;
    }
    this.element.innerHTML = '';
  }
}

/**
 * Factory function for creating TrendBadge instances
 * @param {Element|string} element - DOM element or selector
 * @param {Object} config - Badge configuration
 * @returns {TrendBadge} Badge instance
 */
export function createTrendBadge(element, config) {
  return new TrendBadge(element, config);
}

export default TrendBadge;
