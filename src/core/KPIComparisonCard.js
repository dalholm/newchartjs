/**
 * KPI Comparison Card — Enhanced KPI widget combining
 * sparkline + bullet indicator + trend badge + target tracking
 */

import { isDarkMode, DARK_KPI_COLORS } from './defaults.js';
import { formatNumber } from './utils.js';

/**
 * @typedef {Object} KPIComparisonConfig
 * @property {string} label - KPI name
 * @property {number} value - Current value
 * @property {number} [previousValue] - Previous period value
 * @property {number} [target] - Target value
 * @property {string} [prefix] - Value prefix (e.g., '$', 'kr')
 * @property {string} [suffix] - Value suffix (e.g., '%', 'st')
 * @property {number} [decimals=0] - Decimal places
 * @property {number[]} [sparklineData] - Array of values for mini sparkline
 * @property {'up-good'|'down-good'} [direction='up-good'] - Whether increase is positive
 * @property {string} [theme='light'] - 'light', 'dark', 'auto'
 * @property {string} [status] - 'good', 'warning', 'danger' (overrides auto-detection)
 */

export class KPIComparisonCard {
  /**
   * @param {Element|string} element - DOM element or selector
   * @param {KPIComparisonConfig} config
   */
  constructor(element, config = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    if (!this.element) throw new Error('KPIComparisonCard element not found');

    this.config = config;
    this._dark = isDarkMode(config.theme);
    this.render();
  }

  /**
   * Render the KPI comparison card
   */
  render() {
    const c = this.config;
    const dark = this._dark;
    const colors = dark ? DARK_KPI_COLORS : {
      up: '#0ca678',
      upBg: 'rgba(12, 166, 120, 0.1)',
      down: '#e03131',
      downBg: 'rgba(224, 49, 49, 0.1)',
      good: '#0ca678',
      warning: '#f08c00',
      danger: '#e03131',
      label: '#6b7280',
      value: '#1a1d23',
      previous: '#9ca3af',
      border: '#e5e7eb',
      borderActive: '#4c6ef5',
      surface: '#ffffff',
      progressTrack: '#f1f3f5'
    };

    // Calculate change
    const hasChange = c.previousValue !== undefined && c.previousValue !== null;
    const change = hasChange ? ((c.value - c.previousValue) / Math.abs(c.previousValue || 1)) * 100 : null;
    const isPositive = change !== null && change >= 0;
    const isGood = c.direction === 'down-good' ? !isPositive : isPositive;

    // Status
    const status = c.status || (c.target
      ? (c.value >= c.target ? 'good' : c.value >= c.target * 0.85 ? 'warning' : 'danger')
      : (isGood ? 'good' : 'danger'));

    const statusColor = colors[status] || colors.good;

    // Achievement
    const achievement = c.target ? (c.value / c.target * 100) : null;

    // Format value
    const formattedValue = (c.prefix || '') + formatNumber(c.value, c.decimals || 0) + (c.suffix || '');

    // Sparkline SVG
    let sparklineSVG = '';
    if (c.sparklineData?.length > 1) {
      const sparkData = c.sparklineData;
      const w = 80, h = 24;
      const min = Math.min(...sparkData);
      const max = Math.max(...sparkData);
      const range = max - min || 1;

      const points = sparkData.map((v, i) => {
        const x = (i / (sparkData.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
      }).join(' ');

      const lineColor = isGood ? colors.good : colors.danger;

      sparklineSVG = `
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;">
          <polyline points="${points}" fill="none" stroke="${lineColor}" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="${w}" cy="${h - ((sparkData[sparkData.length-1] - min) / range) * h}"
            r="2" fill="${lineColor}"/>
        </svg>`;
    }

    // Bullet bar
    let bulletHTML = '';
    if (c.target) {
      const pct = Math.min((c.value / c.target) * 100, 120);
      bulletHTML = `
        <div style="margin-top:8px;">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:${colors.label};margin-bottom:3px;">
            <span>Progress</span>
            <span style="font-family:monospace;">${formatNumber(achievement, 1)}%</span>
          </div>
          <div style="height:6px;background:${colors.progressTrack};border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${Math.min(pct, 100)}%;background:${statusColor};border-radius:3px;transition:width 0.6s ease-out;"></div>
          </div>
        </div>`;
    }

    // Change badge
    let changeHTML = '';
    if (change !== null) {
      const arrow = isPositive ? '&#9650;' : '&#9660;';
      const badgeColor = isGood ? colors.up : colors.down;
      const badgeBg = isGood ? colors.upBg : colors.downBg;

      changeHTML = `
        <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;
          border-radius:10px;font-size:11px;font-weight:600;
          color:${badgeColor};background:${badgeBg};">
          <span style="font-size:8px;">${arrow}</span>
          ${formatNumber(Math.abs(change), 1)}%
        </span>`;
    }

    this.element.innerHTML = `
      <div style="padding:16px;background:${colors.surface};border:1px solid ${colors.border};
        border-radius:8px;font-family:'Inter',-apple-system,sans-serif;
        transition:border-color 0.15s;cursor:default;"
        onmouseenter="this.style.borderColor='${colors.borderActive}'"
        onmouseleave="this.style.borderColor='${colors.border}'">

        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:11px;color:${colors.label};font-weight:500;text-transform:uppercase;
              letter-spacing:0.5px;margin-bottom:6px;">${c.label || 'KPI'}</div>
            <div style="font-size:22px;font-weight:700;color:${colors.value};line-height:1;">
              ${formattedValue}
            </div>
          </div>
          <div style="text-align:right;">
            ${sparklineSVG}
            <div style="margin-top:4px;">${changeHTML}</div>
          </div>
        </div>

        ${c.previousValue !== undefined ? `
          <div style="font-size:11px;color:${colors.previous};margin-top:6px;">
            Previous: ${(c.prefix || '') + formatNumber(c.previousValue, c.decimals || 0) + (c.suffix || '')}
            ${c.target ? ` &middot; Target: ${(c.prefix || '') + formatNumber(c.target, c.decimals || 0) + (c.suffix || '')}` : ''}
          </div>
        ` : ''}

        ${bulletHTML}

        ${status ? `
          <div style="margin-top:8px;display:flex;align-items:center;gap:5px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${statusColor};"></span>
            <span style="font-size:10px;color:${colors.label};text-transform:capitalize;">${status}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Update the card with new data
   * @param {Partial<KPIComparisonConfig>} config
   */
  update(config) {
    Object.assign(this.config, config);
    this._dark = isDarkMode(this.config.theme);
    this.render();
  }

  /**
   * Destroy the card
   */
  destroy() {
    if (this.element) {
      this.element.innerHTML = '';
    }
  }
}

/**
 * Factory function
 * @param {Element|string} element
 * @param {KPIComparisonConfig} config
 * @returns {KPIComparisonCard}
 */
export function createKPIComparisonCard(element, config) {
  return new KPIComparisonCard(element, config);
}

export default KPIComparisonCard;
