/**
 * Tooltip component for charts
 *
 * Supports two content formats:
 * 1. Simple object: { key: value } — rendered as key: value rows
 * 2. Rich format: { header, rows: [{ color, label, value }], footer } — renders
 *    structured rows with color swatches, like SAP Fiori / ERP dashboards
 */

import { createElement, getCursorPosition } from './utils.js';

export class Tooltip {
  /**
   * Create a tooltip instance
   * @param {Element} container - Container element
   * @param {Object} options - Tooltip options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      background: '#1a1d23',
      color: '#e8eaed',
      fontSize: 11,
      padding: 10,
      borderRadius: 6,
      shadow: '0 8px 24px rgba(0,0,0,0.35)',
      border: '1px solid #2d3139',
      fontFamily: 'inherit',
      monoFamily: 'monospace',
      ...options
    };

    this.element = null;
    this.visible = false;
    this.currentX = 0;
    this.currentY = 0;
  }

  /**
   * Create and mount the tooltip element
   */
  mount() {
    if (this.element) return;

    this.element = createElement('div', {
      style: {
        position: 'absolute',
        background: this.options.background,
        color: this.options.color,
        fontSize: this.options.fontSize + 'px',
        padding: this.options.padding + 'px' + ' ' + (this.options.padding + 4) + 'px',
        borderRadius: this.options.borderRadius + 'px',
        boxShadow: this.options.shadow,
        border: this.options.border || 'none',
        pointerEvents: 'none',
        zIndex: '1000',
        display: 'none',
        maxWidth: '300px',
        wordWrap: 'break-word',
        whiteSpace: 'normal',
        fontFamily: this.options.fontFamily || 'inherit',
        lineHeight: '1.6'
      }
    });

    this.container.appendChild(this.element);
  }

  /**
   * Show tooltip at position with content
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string|Object} content - Content to display
   *
   * Rich format:
   * {
   *   header: 'Jan 2026',
   *   rows: [
   *     { color: '#4c6ef5', label: '2026', value: '2,850 kr' },
   *     { color: '#b3bac5', label: '2025', value: '2,200 kr' }
   *   ],
   *   footer: { label: 'YoY:', value: '+29.5%', color: '#69db7c' }
   * }
   */
  show(x, y, content) {
    this.mount();

    this.element.textContent = '';

    if (typeof content === 'string') {
      this.element.textContent = content;
    } else if (content && content.rows) {
      this._renderRich(content);
    } else if (typeof content === 'object') {
      this._renderSimple(content);
    }

    // Position tooltip
    this.currentX = x;
    this.currentY = y;
    this.updatePosition();

    this.element.style.display = 'block';
    this.visible = true;
  }

  /**
   * Render simple key-value pairs
   * @param {Object} content - { key: value } map
   */
  _renderSimple(content) {
    Object.entries(content).forEach(([key, value]) => {
      const row = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = key + ':';
      row.appendChild(strong);
      if (value) {
        row.appendChild(document.createTextNode(' ' + value));
      }
      this.element.appendChild(row);
    });
  }

  /**
   * Render rich tooltip with header, color swatches, and footer
   * @param {Object} content - { header, rows, footer }
   */
  _renderRich(content) {
    const mono = this.options.monoFamily || 'monospace';

    // Header
    if (content.header) {
      const header = document.createElement('div');
      Object.assign(header.style, {
        fontWeight: '600',
        marginBottom: '4px',
        borderBottom: '1px solid #333',
        paddingBottom: '4px'
      });
      header.textContent = content.header;
      this.element.appendChild(header);
    }

    // Data rows
    content.rows.forEach(row => {
      const rowEl = document.createElement('div');
      Object.assign(rowEl.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      });

      // Left side: swatch + label
      const left = document.createElement('span');
      Object.assign(left.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      });

      if (row.color) {
        const swatch = document.createElement('span');
        const isDashed = row.style === 'dashed';
        Object.assign(swatch.style, {
          width: '8px',
          height: isDashed ? '0px' : '3px',
          borderRadius: '1px',
          display: 'inline-block',
          flexShrink: '0'
        });
        if (isDashed) {
          // Dashed swatch: top border as dashed line
          swatch.style.borderTop = `2px dashed ${row.color}`;
        } else {
          swatch.style.background = row.color;
        }
        left.appendChild(swatch);
      }

      left.appendChild(document.createTextNode(row.label));
      rowEl.appendChild(left);

      // Right side: value
      const right = document.createElement('span');
      Object.assign(right.style, {
        fontFamily: mono,
        whiteSpace: 'nowrap'
      });
      right.textContent = row.value;
      rowEl.appendChild(right);

      this.element.appendChild(rowEl);
    });

    // Footer (e.g. YoY)
    if (content.footer) {
      const footer = document.createElement('div');
      Object.assign(footer.style, {
        borderTop: '1px solid #333',
        marginTop: '4px',
        paddingTop: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px'
      });

      const label = document.createElement('span');
      label.style.color = '#8993a4';
      label.textContent = content.footer.label;
      footer.appendChild(label);

      const val = document.createElement('span');
      Object.assign(val.style, {
        fontFamily: mono,
        color: content.footer.color || this.options.color
      });
      val.textContent = content.footer.value;
      footer.appendChild(val);

      this.element.appendChild(footer);
    }
  }

  /**
   * Update tooltip position
   */
  updatePosition() {
    if (!this.element) return;

    const rect = this.element.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    let x = this.currentX;
    let y = this.currentY - rect.height - 10;

    // Adjust if tooltip goes off screen
    if (x + rect.width > containerRect.width) {
      x = containerRect.width - rect.width - 10;
    }

    if (x < 0) {
      x = 10;
    }

    if (y < 0) {
      y = this.currentY + 10;
    }

    this.element.style.left = x + 'px';
    this.element.style.top = y + 'px';
  }

  /**
   * Follow mouse movement
   * @param {MouseEvent} event - Mouse event
   */
  follow(event) {
    if (!this.visible) return;

    const pos = getCursorPosition(event, this.container);
    this.currentX = pos.x;
    this.currentY = pos.y;
    this.updatePosition();
  }

  /**
   * Hide tooltip
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
    this.visible = false;
  }

  /**
   * Destroy tooltip
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

export default Tooltip;
