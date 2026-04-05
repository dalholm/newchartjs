/**
 * Tooltip component for charts
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
      background: '#1F2937',
      color: '#FFFFFF',
      fontSize: 12,
      padding: 8,
      borderRadius: 4,
      shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
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
        padding: this.options.padding + 'px',
        borderRadius: this.options.borderRadius + 'px',
        boxShadow: this.options.shadow,
        pointerEvents: 'none',
        zIndex: '1000',
        display: 'none',
        whiteSpace: 'nowrap',
        maxWidth: '300px',
        wordWrap: 'break-word',
        whiteSpace: 'normal',
        fontFamily: 'inherit'
      }
    });

    this.container.appendChild(this.element);
  }

  /**
   * Show tooltip at position with content
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string|Object} content - Content to display
   */
  show(x, y, content) {
    this.mount();

    if (typeof content === 'object') {
      this.element.innerHTML = Object.entries(content)
        .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
        .join('');
    } else {
      this.element.innerHTML = content;
    }

    // Position tooltip
    this.currentX = x;
    this.currentY = y;
    this.updatePosition();

    this.element.style.display = 'block';
    this.visible = true;
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
