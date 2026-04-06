/**
 * LiveWidget — Real-time e-commerce dashboard widgets
 *
 * Standalone, config-driven live widgets that show real-time metrics
 * with smooth animated transitions. Four built-in variants:
 *
 * 1. **visitors** — Online visitors + active carts with page list (like GA/Shopify live view)
 * 2. **revenue**  — Live revenue ticker with rolling sparkline and order count
 * 3. **activity** — Order activity feed with animated entries
 * 4. **pulse**    — Conversion funnel pulse with animated progress bars
 *
 * Usage:
 *   const widget = NewChart.liveWidget('#el', {
 *     variant: 'visitors',
 *     title: 'Live Store',
 *     data: { visitors: 24, carts: 3, pages: [...] }
 *   });
 *
 *   // Update with new data (smooth transitions)
 *   widget.update({ visitors: 27, carts: 4, pages: [...] });
 *
 *   // Destroy
 *   widget.destroy();
 */

import { formatNumber } from './utils.js';
import { isDarkMode, DARK_KPI_COLORS } from './defaults.js';

/**
 * Default LiveWidget configuration
 */
const LIVE_DEFAULTS = {
  variant: 'visitors',
  title: '',
  theme: 'light',
  updateInterval: null,
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  monoFont: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  colors: {
    surface: '#ffffff',
    border: '#dfe1e6',
    text: '#172b4d',
    textSec: '#5e6c84',
    textMuted: '#8993a4',
    textFaint: '#b3bac5',
    primary: '#4c6ef5',
    primaryLt: '#edf2ff',
    success: '#0ca678',
    successLt: '#e6fcf5',
    danger: '#e03131',
    dangerLt: '#fff5f5',
    warning: '#f08c00',
    warningLt: '#fff9db',
    pulse: '#0ca678',
    dot: '#0ca678',
    rowHover: 'rgba(76, 110, 245, 0.04)',
    headerBorder: '#ebecf0'
  },
  data: {}
};

const DARK_COLORS = {
  surface: '#1a1d23',
  border: '#2d3139',
  text: '#e0e2e7',
  textSec: '#a1a7b3',
  textMuted: '#6b7280',
  textFaint: '#4b5060',
  primary: '#5c7cfa',
  primaryLt: 'rgba(92, 124, 250, 0.12)',
  success: '#20c997',
  successLt: 'rgba(32, 201, 151, 0.12)',
  danger: '#ff6b6b',
  dangerLt: 'rgba(255, 107, 107, 0.12)',
  warning: '#fcc419',
  warningLt: 'rgba(252, 196, 25, 0.12)',
  pulse: '#20c997',
  dot: '#20c997',
  rowHover: 'rgba(92, 124, 250, 0.08)',
  headerBorder: '#3d4350'
};

export class LiveWidget {
  /**
   * Create a LiveWidget
   * @param {Element|string} element - DOM element or CSS selector
   * @param {Object} config - Widget configuration
   */
  constructor(element, config = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    if (!this.element) throw new Error('LiveWidget element not found');

    this._dark = isDarkMode(config.theme || 'light');
    this.config = {
      ...LIVE_DEFAULTS,
      ...config,
      colors: {
        ...(this._dark ? DARK_COLORS : LIVE_DEFAULTS.colors),
        ...(config.colors || {})
      }
    };
    this.data = { ...this.config.data };
    this._animatedValues = {};
    this._animationFrames = {};
    this._intervals = [];
    this._root = null;

    this._render();
  }

  /**
   * Update widget data with smooth transitions
   * @param {Object} newData - Partial data to merge
   */
  update(newData) {
    const oldData = { ...this.data };
    this.data = { ...this.data, ...newData };

    switch (this.config.variant) {
      case 'visitors':
        this._updateVisitors(oldData);
        break;
      case 'revenue':
        this._updateRevenue(oldData);
        break;
      case 'activity':
        this._updateActivity(oldData);
        break;
      case 'pulse':
        this._updatePulse(oldData);
        break;
    }
  }

  /**
   * Destroy widget and clean up
   */
  destroy() {
    Object.values(this._animationFrames).forEach(id => cancelAnimationFrame(id));
    this._intervals.forEach(id => clearInterval(id));
    if (this._root && this._root.parentNode) {
      this._root.parentNode.removeChild(this._root);
    }
    this._root = null;
  }

  // ── Render dispatcher ──────────────────────────────────────────

  _render() {
    this._root = document.createElement('div');
    this._root.className = 'nc-live-widget';

    switch (this.config.variant) {
      case 'visitors':
        this._renderVisitors();
        break;
      case 'revenue':
        this._renderRevenue();
        break;
      case 'activity':
        this._renderActivity();
        break;
      case 'pulse':
        this._renderPulse();
        break;
      default:
        this._renderVisitors();
    }

    this.element.appendChild(this._root);
  }

  // ══════════════════════════════════════════════════════════════
  //  VARIANT 1: VISITORS & CARTS
  // ══════════════════════════════════════════════════════════════

  _renderVisitors() {
    const { colors, font, monoFont } = this.config;
    const d = this.data;

    this._root.innerHTML = `
      <style>
        .nc-lw-visitors {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 12px;
          overflow: hidden;
          font-family: ${font};
        }
        .nc-lw-visitors .lw-hero {
          display: flex;
          padding: 24px 28px 20px;
          gap: 40px;
        }
        .nc-lw-visitors .lw-hero-item {
          display: flex;
          flex-direction: column;
        }
        .nc-lw-visitors .lw-hero-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: ${colors.textMuted};
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .nc-lw-visitors .lw-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${colors.dot};
          animation: nc-lw-pulse 2s ease-in-out infinite;
        }
        @keyframes nc-lw-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .nc-lw-visitors .lw-hero-value {
          font-size: 42px;
          font-weight: 800;
          color: ${colors.text};
          font-family: ${font};
          line-height: 1;
          letter-spacing: -1px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nc-lw-visitors .lw-hero-suffix {
          font-size: 18px;
          font-weight: 600;
          color: ${colors.textMuted};
          margin-left: 4px;
        }
        .nc-lw-visitors .lw-tabs {
          display: flex;
          border-bottom: 1px solid ${colors.headerBorder};
          padding: 0 28px;
        }
        .nc-lw-visitors .lw-tab {
          padding: 10px 0;
          margin-right: 24px;
          font-size: 12px;
          font-weight: 600;
          color: ${colors.textMuted};
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s;
          font-family: ${font};
        }
        .nc-lw-visitors .lw-tab.active {
          color: ${colors.primary};
          border-bottom-color: ${colors.primary};
        }
        .nc-lw-visitors .lw-tab:hover:not(.active) {
          color: ${colors.textSec};
        }
        .nc-lw-visitors .lw-list {
          max-height: 320px;
          overflow-y: auto;
        }
        .nc-lw-visitors .lw-list-header {
          display: flex;
          justify-content: space-between;
          padding: 10px 28px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: ${colors.textMuted};
          border-bottom: 1px solid ${colors.headerBorder};
          position: sticky;
          top: 0;
          background: ${colors.surface};
          z-index: 1;
        }
        .nc-lw-visitors .lw-list-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 28px;
          font-size: 13px;
          color: ${colors.text};
          border-bottom: 1px solid ${colors.headerBorder};
          transition: background 0.1s;
        }
        .nc-lw-visitors .lw-list-row:hover {
          background: ${colors.rowHover};
        }
        .nc-lw-visitors .lw-list-row:last-child {
          border-bottom: none;
        }
        .nc-lw-visitors .lw-page-url {
          font-family: ${monoFont};
          font-size: 12px;
          color: ${colors.textSec};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 75%;
        }
        .nc-lw-visitors .lw-page-count {
          font-family: ${monoFont};
          font-size: 12px;
          font-weight: 600;
          color: ${colors.text};
          min-width: 30px;
          text-align: right;
        }
        .nc-lw-visitors .lw-empty {
          padding: 32px 28px;
          text-align: center;
          font-size: 12px;
          color: ${colors.textMuted};
        }
        .nc-lw-visitors .lw-cart-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 28px;
          font-size: 13px;
          color: ${colors.text};
          border-bottom: 1px solid ${colors.headerBorder};
        }
        .nc-lw-visitors .lw-cart-value {
          font-family: ${monoFont};
          font-size: 12px;
          font-weight: 600;
          color: ${colors.success};
        }
        .nc-lw-visitors .lw-cart-items {
          font-size: 11px;
          color: ${colors.textMuted};
        }
        .nc-lw-visitors .lw-row-enter {
          animation: nc-lw-row-in 0.3s ease-out;
        }
        @keyframes nc-lw-row-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
      <div class="nc-lw-visitors">
        <div class="lw-hero">
          <div class="lw-hero-item">
            <div class="lw-hero-label">
              <span class="lw-pulse-dot"></span>
              Online just nu
            </div>
            <div class="lw-hero-value" data-field="visitors">${d.visitors || 0}<span class="lw-hero-suffix"> st</span></div>
          </div>
          <div class="lw-hero-item">
            <div class="lw-hero-label">Aktiva varukorgar</div>
            <div class="lw-hero-value" data-field="carts">${d.carts || 0}<span class="lw-hero-suffix"> st</span></div>
          </div>
        </div>
        <div class="lw-tabs">
          <button class="lw-tab active" data-tab="pages">Besökare</button>
          <button class="lw-tab" data-tab="carts">Varukorgar</button>
        </div>
        <div class="lw-list-header">
          <span data-tab-label="left">Sida</span>
          <span data-tab-label="right">Besökare</span>
        </div>
        <div class="lw-list" data-list="content"></div>
      </div>
    `;

    this._activeTab = 'pages';
    this._renderVisitorList();

    // Tab switching
    const tabs = this._root.querySelectorAll('.lw-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._activeTab = tab.dataset.tab;
        const leftLabel = this._root.querySelector('[data-tab-label="left"]');
        const rightLabel = this._root.querySelector('[data-tab-label="right"]');
        if (this._activeTab === 'carts') {
          leftLabel.textContent = 'Produkt';
          rightLabel.textContent = 'Värde';
        } else {
          leftLabel.textContent = 'Sida';
          rightLabel.textContent = 'Besökare';
        }
        this._renderVisitorList();
      });
    });
  }

  _renderVisitorList() {
    const list = this._root.querySelector('[data-list="content"]');
    if (!list) return;

    if (this._activeTab === 'pages') {
      const pages = this.data.pages || [];
      if (pages.length === 0) {
        list.innerHTML = '<div class="lw-empty">Inga besökare just nu</div>';
        return;
      }
      list.innerHTML = pages.map(p => `
        <div class="lw-list-row">
          <span class="lw-page-url">${this._escapeHtml(p.url)}</span>
          <span class="lw-page-count">${p.count}</span>
        </div>
      `).join('');
    } else {
      const carts = this.data.cartItems || [];
      if (carts.length === 0) {
        list.innerHTML = '<div class="lw-empty">Inga aktiva varukorgar</div>';
        return;
      }
      list.innerHTML = carts.map(c => `
        <div class="lw-cart-row">
          <div>
            <div style="font-size:13px;color:${this.config.colors.text}">${this._escapeHtml(c.product)}</div>
            <div class="lw-cart-items">${c.qty} st</div>
          </div>
          <div class="lw-cart-value">${this._formatCurrency(c.value)}</div>
        </div>
      `).join('');
    }
  }

  _updateVisitors(oldData) {
    // Animate hero numbers
    this._animateNumber('visitors', oldData.visitors || 0, this.data.visitors || 0);
    this._animateNumber('carts', oldData.carts || 0, this.data.carts || 0);

    // Re-render list with animation
    this._renderVisitorList();

    // Animate new rows
    const rows = this._root.querySelectorAll('.lw-list-row, .lw-cart-row');
    rows.forEach((row, i) => {
      if (i < 3) row.classList.add('lw-row-enter');
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  VARIANT 2: REVENUE TICKER
  // ══════════════════════════════════════════════════════════════

  _renderRevenue() {
    const { colors, font, monoFont } = this.config;
    const d = this.data;

    this._root.innerHTML = `
      <style>
        .nc-lw-revenue {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 12px;
          overflow: hidden;
          font-family: ${font};
          padding: 24px 28px;
        }
        .nc-lw-revenue .lw-rev-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .nc-lw-revenue .lw-rev-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: ${colors.textMuted};
        }
        .nc-lw-revenue .lw-live-badge {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 7px;
          border-radius: 10px;
          background: ${colors.dangerLt};
          color: ${colors.danger};
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .nc-lw-revenue .lw-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${colors.danger};
          animation: nc-lw-pulse 1.5s ease-in-out infinite;
        }
        .nc-lw-revenue .lw-rev-value {
          font-size: 48px;
          font-weight: 800;
          color: ${colors.text};
          line-height: 1.1;
          letter-spacing: -2px;
          font-family: ${font};
          margin-bottom: 16px;
          transition: all 0.3s;
        }
        .nc-lw-revenue .lw-rev-suffix {
          font-size: 20px;
          font-weight: 600;
          color: ${colors.textMuted};
        }
        .nc-lw-revenue .lw-rev-stats {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
        }
        .nc-lw-revenue .lw-rev-stat {
          display: flex;
          flex-direction: column;
        }
        .nc-lw-revenue .lw-rev-stat-label {
          font-size: 10px;
          color: ${colors.textMuted};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .nc-lw-revenue .lw-rev-stat-value {
          font-size: 18px;
          font-weight: 700;
          color: ${colors.text};
          font-family: ${monoFont};
        }
        .nc-lw-revenue .lw-rev-spark {
          height: 60px;
          width: 100%;
          position: relative;
        }
        .nc-lw-revenue .lw-rev-spark canvas {
          width: 100%;
          height: 100%;
        }
        .nc-lw-revenue .lw-rev-change {
          font-size: 12px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .nc-lw-revenue .lw-rev-change.up {
          background: ${colors.successLt};
          color: ${colors.success};
        }
        .nc-lw-revenue .lw-rev-change.down {
          background: ${colors.dangerLt};
          color: ${colors.danger};
        }
        .nc-lw-revenue .lw-rev-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid ${colors.headerBorder};
        }
        .nc-lw-revenue .lw-rev-last-order {
          font-size: 11px;
          color: ${colors.textMuted};
        }
        .nc-lw-revenue .lw-rev-last-order strong {
          color: ${colors.text};
          font-weight: 600;
        }
        @keyframes nc-lw-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      </style>
      <div class="nc-lw-revenue">
        <div class="lw-rev-header">
          <span class="lw-rev-label">${this.config.title || 'Omsättning idag'}</span>
          <span class="lw-live-badge"><span class="lw-live-dot"></span> LIVE</span>
        </div>
        <div class="lw-rev-value" data-field="revenue">${this._formatCurrency(d.revenue || 0)}</div>
        <div class="lw-rev-stats">
          <div class="lw-rev-stat">
            <span class="lw-rev-stat-label">Ordrar</span>
            <span class="lw-rev-stat-value" data-field="orders">${d.orders || 0}</span>
          </div>
          <div class="lw-rev-stat">
            <span class="lw-rev-stat-label">Snittorder</span>
            <span class="lw-rev-stat-value" data-field="avgOrder">${this._formatCurrency(d.avgOrder || 0)}</span>
          </div>
          <div class="lw-rev-stat">
            <span class="lw-rev-stat-label">Konvertering</span>
            <span class="lw-rev-stat-value" data-field="convRate">${(d.convRate || 0).toFixed(1)}%</span>
          </div>
        </div>
        <div class="lw-rev-spark" data-spark="revenue"></div>
        <div class="lw-rev-footer">
          <span class="lw-rev-last-order" data-field="lastOrder">Senaste order: <strong>${this._formatCurrency(d.lastOrderValue || 0)}</strong> — ${d.lastOrderTime || 'just nu'}</span>
          <span class="lw-rev-change ${(d.changePercent || 0) >= 0 ? 'up' : 'down'}" data-field="change">
            ${(d.changePercent || 0) >= 0 ? '↑' : '↓'} ${Math.abs(d.changePercent || 0).toFixed(1)}% vs igår
          </span>
        </div>
      </div>
    `;

    this._sparkData = d.sparkline || [];
    this._drawRevenueSparkline();
  }

  _drawRevenueSparkline() {
    const container = this._root.querySelector('[data-spark="revenue"]');
    if (!container) return;

    const canvas = document.createElement('canvas');
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (rect.width || 300) * dpr;
    canvas.height = (rect.height || 60) * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return; // jsdom fallback
    ctx.scale(dpr, dpr);
    const w = rect.width || 300;
    const h = rect.height || 60;

    const data = this._sparkData;
    if (data.length < 2) return;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const pad = 4;

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = pad + (1 - (v - min) / range) * (h - 2 * pad);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = this.config.colors.primary;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Fill gradient
    const lastX = w;
    const lastY = pad + (1 - (data[data.length - 1] - min) / range) * (h - 2 * pad);
    ctx.lineTo(lastX, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, this.config.colors.primary + '20');
    grad.addColorStop(1, this.config.colors.primary + '02');
    ctx.fillStyle = grad;
    ctx.fill();

    // Last point dot
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.config.colors.primary;
    ctx.fill();
    ctx.strokeStyle = this.config.colors.surface;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  _updateRevenue(oldData) {
    // Update revenue number
    const revEl = this._root.querySelector('[data-field="revenue"]');
    if (revEl) revEl.textContent = this._formatCurrency(this.data.revenue || 0);

    const ordersEl = this._root.querySelector('[data-field="orders"]');
    if (ordersEl) ordersEl.textContent = this.data.orders || 0;

    const avgEl = this._root.querySelector('[data-field="avgOrder"]');
    if (avgEl) avgEl.textContent = this._formatCurrency(this.data.avgOrder || 0);

    const convEl = this._root.querySelector('[data-field="convRate"]');
    if (convEl) convEl.textContent = (this.data.convRate || 0).toFixed(1) + '%';

    const lastEl = this._root.querySelector('[data-field="lastOrder"]');
    if (lastEl) lastEl.innerHTML = `Senaste order: <strong>${this._formatCurrency(this.data.lastOrderValue || 0)}</strong> — ${this.data.lastOrderTime || 'just nu'}`;

    const changeEl = this._root.querySelector('[data-field="change"]');
    if (changeEl) {
      const pct = this.data.changePercent || 0;
      changeEl.className = `lw-rev-change ${pct >= 0 ? 'up' : 'down'}`;
      changeEl.textContent = `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}% vs igår`;
    }

    // Update sparkline
    if (this.data.sparkline) {
      this._sparkData = this.data.sparkline;
      this._drawRevenueSparkline();
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  VARIANT 3: ACTIVITY FEED
  // ══════════════════════════════════════════════════════════════

  _renderActivity() {
    const { colors, font, monoFont } = this.config;

    this._root.innerHTML = `
      <style>
        .nc-lw-activity {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 12px;
          overflow: hidden;
          font-family: ${font};
        }
        .nc-lw-activity .lw-act-header {
          padding: 16px 24px;
          border-bottom: 1px solid ${colors.headerBorder};
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nc-lw-activity .lw-act-title {
          font-size: 13px;
          font-weight: 600;
          color: ${colors.text};
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nc-lw-activity .lw-act-count {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
          background: ${colors.primaryLt};
          color: ${colors.primary};
          font-family: ${monoFont};
        }
        .nc-lw-activity .lw-act-list {
          max-height: 380px;
          overflow-y: auto;
        }
        .nc-lw-activity .lw-act-item {
          display: flex;
          align-items: flex-start;
          padding: 12px 24px;
          gap: 12px;
          border-bottom: 1px solid ${colors.headerBorder};
          transition: background 0.1s;
        }
        .nc-lw-activity .lw-act-item:hover {
          background: ${colors.rowHover};
        }
        .nc-lw-activity .lw-act-item:last-child {
          border-bottom: none;
        }
        .nc-lw-activity .lw-act-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .nc-lw-activity .lw-act-icon.order {
          background: ${colors.successLt};
        }
        .nc-lw-activity .lw-act-icon.cart {
          background: ${colors.warningLt};
        }
        .nc-lw-activity .lw-act-icon.visit {
          background: ${colors.primaryLt};
        }
        .nc-lw-activity .lw-act-icon.refund {
          background: ${colors.dangerLt};
        }
        .nc-lw-activity .lw-act-body {
          flex: 1;
          min-width: 0;
        }
        .nc-lw-activity .lw-act-text {
          font-size: 13px;
          color: ${colors.text};
          line-height: 1.4;
        }
        .nc-lw-activity .lw-act-text strong {
          font-weight: 600;
        }
        .nc-lw-activity .lw-act-meta {
          font-size: 11px;
          color: ${colors.textMuted};
          margin-top: 2px;
        }
        .nc-lw-activity .lw-act-amount {
          font-family: ${monoFont};
          font-size: 13px;
          font-weight: 600;
          color: ${colors.success};
          flex-shrink: 0;
          align-self: center;
        }
        .nc-lw-activity .lw-act-amount.refund {
          color: ${colors.danger};
        }
        .nc-lw-activity .lw-act-item-enter {
          animation: nc-lw-feed-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes nc-lw-feed-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      </style>
      <div class="nc-lw-activity">
        <div class="lw-act-header">
          <div class="lw-act-title">
            ${this.config.title || 'Orderflöde'}
            <span class="lw-act-count" data-field="count">${(this.data.events || []).length}</span>
          </div>
          <span class="lw-live-badge" style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:2px 7px;border-radius:10px;background:${colors.dangerLt};color:${colors.danger};display:inline-flex;align-items:center;gap:4px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${colors.danger};animation:nc-lw-pulse 1.5s ease-in-out infinite;"></span> LIVE
          </span>
        </div>
        <div class="lw-act-list" data-list="events"></div>
      </div>
    `;

    this._renderActivityList();
  }

  _renderActivityList() {
    const list = this._root.querySelector('[data-list="events"]');
    if (!list) return;

    const events = this.data.events || [];
    if (events.length === 0) {
      list.innerHTML = `<div style="padding:32px 24px;text-align:center;font-size:12px;color:${this.config.colors.textMuted}">Väntar på aktivitet...</div>`;
      return;
    }

    list.innerHTML = events.map(e => {
      const iconMap = { order: '🛒', cart: '🛍️', visit: '👀', refund: '↩️' };
      const icon = iconMap[e.type] || '📦';
      return `
        <div class="lw-act-item">
          <div class="lw-act-icon ${e.type}">${icon}</div>
          <div class="lw-act-body">
            <div class="lw-act-text">${e.text}</div>
            <div class="lw-act-meta">${e.time}</div>
          </div>
          ${e.amount ? `<div class="lw-act-amount ${e.type === 'refund' ? 'refund' : ''}">${e.type === 'refund' ? '-' : '+'}${this._formatCurrency(e.amount)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  _updateActivity() {
    const countEl = this._root.querySelector('[data-field="count"]');
    if (countEl) countEl.textContent = (this.data.events || []).length;
    this._renderActivityList();

    // Animate first item
    const firstItem = this._root.querySelector('.lw-act-item');
    if (firstItem) firstItem.classList.add('lw-act-item-enter');
  }

  // ══════════════════════════════════════════════════════════════
  //  VARIANT 4: CONVERSION PULSE
  // ══════════════════════════════════════════════════════════════

  _renderPulse() {
    const { colors, font, monoFont } = this.config;

    this._root.innerHTML = `
      <style>
        .nc-lw-pulse {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 12px;
          overflow: hidden;
          font-family: ${font};
          padding: 24px 28px;
        }
        .nc-lw-pulse .lw-pulse-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .nc-lw-pulse .lw-pulse-title {
          font-size: 13px;
          font-weight: 600;
          color: ${colors.text};
        }
        .nc-lw-pulse .lw-pulse-rate {
          font-size: 28px;
          font-weight: 800;
          color: ${colors.text};
          letter-spacing: -1px;
        }
        .nc-lw-pulse .lw-pulse-rate-suffix {
          font-size: 14px;
          font-weight: 600;
          color: ${colors.textMuted};
        }
        .nc-lw-pulse .lw-funnel-steps {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .nc-lw-pulse .lw-funnel-step {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 0;
          border-bottom: 1px solid ${colors.headerBorder};
        }
        .nc-lw-pulse .lw-funnel-step:last-child {
          border-bottom: none;
        }
        .nc-lw-pulse .lw-step-info {
          flex: 1;
          min-width: 0;
        }
        .nc-lw-pulse .lw-step-label {
          font-size: 12px;
          font-weight: 500;
          color: ${colors.text};
          margin-bottom: 4px;
        }
        .nc-lw-pulse .lw-step-bar-bg {
          height: 8px;
          border-radius: 4px;
          background: ${colors.headerBorder};
          overflow: hidden;
        }
        .nc-lw-pulse .lw-step-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nc-lw-pulse .lw-step-values {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
          min-width: 60px;
        }
        .nc-lw-pulse .lw-step-count {
          font-family: ${monoFont};
          font-size: 14px;
          font-weight: 700;
          color: ${colors.text};
        }
        .nc-lw-pulse .lw-step-pct {
          font-size: 10px;
          color: ${colors.textMuted};
        }
        .nc-lw-pulse .lw-step-drop {
          font-size: 10px;
          color: ${colors.danger};
          text-align: center;
          padding: 2px 0;
        }
        .nc-lw-pulse .lw-pulse-footer {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid ${colors.headerBorder};
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: ${colors.textMuted};
        }
        .nc-lw-pulse .lw-pulse-footer strong {
          font-weight: 600;
          color: ${colors.text};
        }
      </style>
      <div class="nc-lw-pulse">
        <div class="lw-pulse-header">
          <div>
            <div class="lw-pulse-title">${this.config.title || 'Konvertering live'}</div>
          </div>
          <div>
            <span class="lw-pulse-rate" data-field="rate">${(this.data.conversionRate || 0).toFixed(1)}</span>
            <span class="lw-pulse-rate-suffix">%</span>
          </div>
        </div>
        <div class="lw-funnel-steps" data-list="funnel"></div>
        <div class="lw-pulse-footer">
          <span>Senaste 30 min</span>
          <span data-field="footerStats">Besökare: <strong>${this.data.totalVisitors || 0}</strong> → Köp: <strong>${this.data.totalOrders || 0}</strong></span>
        </div>
      </div>
    `;

    this._renderFunnelSteps();
  }

  _renderFunnelSteps() {
    const container = this._root.querySelector('[data-list="funnel"]');
    if (!container) return;

    const steps = this.data.steps || [];
    const maxCount = steps.length > 0 ? steps[0].count : 1;
    const colors = [
      this.config.colors.primary,
      '#7048e8',
      this.config.colors.warning,
      this.config.colors.success
    ];

    container.innerHTML = steps.map((step, i) => {
      const pct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
      const dropPct = i > 0 && steps[i - 1].count > 0
        ? ((steps[i - 1].count - step.count) / steps[i - 1].count * 100).toFixed(0)
        : null;

      return `
        ${dropPct !== null ? `<div class="lw-step-drop">↓ -${dropPct}%</div>` : ''}
        <div class="lw-funnel-step">
          <div class="lw-step-info">
            <div class="lw-step-label">${step.label}</div>
            <div class="lw-step-bar-bg">
              <div class="lw-step-bar-fill" style="width: ${pct}%; background: ${colors[i % colors.length]}"></div>
            </div>
          </div>
          <div class="lw-step-values">
            <div class="lw-step-count">${step.count}</div>
            <div class="lw-step-pct">${pct.toFixed(0)}%</div>
          </div>
        </div>
      `;
    }).join('');
  }

  _updatePulse() {
    const rateEl = this._root.querySelector('[data-field="rate"]');
    if (rateEl) rateEl.textContent = (this.data.conversionRate || 0).toFixed(1);

    const footerEl = this._root.querySelector('[data-field="footerStats"]');
    if (footerEl) {
      footerEl.innerHTML = `Besökare: <strong>${this.data.totalVisitors || 0}</strong> → Köp: <strong>${this.data.totalOrders || 0}</strong>`;
    }

    this._renderFunnelSteps();
  }

  // ── Shared helpers ────────────────────────────────────────────

  /**
   * Animate a hero number from old to new value
   * @param {string} field - data-field attribute value
   * @param {number} from - Start value
   * @param {number} to - End value
   */
  _animateNumber(field, from, to) {
    if (from === to) return;

    const el = this._root.querySelector(`[data-field="${field}"]`);
    if (!el) return;

    if (this._animationFrames[field]) cancelAnimationFrame(this._animationFrames[field]);

    const suffix = el.querySelector('.lw-hero-suffix');
    const suffixHtml = suffix ? suffix.outerHTML : '';

    const duration = 500;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);

      el.innerHTML = current + suffixHtml;

      if (progress < 1) {
        this._animationFrames[field] = requestAnimationFrame(tick);
      }
    };

    this._animationFrames[field] = requestAnimationFrame(tick);
  }

  /**
   * Format a number as Swedish currency
   * @param {number} value
   * @returns {string}
   */
  _formatCurrency(value) {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.', ',') + ' Mkr';
    }
    if (value >= 10000) {
      return Math.round(value).toLocaleString('sv-SE') + ' kr';
    }
    return value.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' kr';
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} str
   * @returns {string}
   */
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

/**
 * Factory function for creating LiveWidgets
 * @param {Element|string} element - DOM element or CSS selector
 * @param {Object} config - Widget configuration
 * @returns {LiveWidget} Widget instance
 */
export function createLiveWidget(element, config) {
  return new LiveWidget(element, config);
}

export default LiveWidget;
