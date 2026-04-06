/**
 * Breadcrumb navigation component for drill-down charts.
 * Follows the same lifecycle pattern as Legend and Tooltip.
 */

import { createElement } from './utils.js';

export class Breadcrumb {
  /**
   * @param {Element} container - Chart container element
   * @param {Object} [options]
   * @param {number} [options.fontSize=12]
   * @param {string} [options.color='#374151']
   * @param {string} [options.activeColor='#4c6ef5']
   * @param {string} [options.separator=' › ']
   * @param {string} [options.padding='6px 0']
   * @param {string} [options.fontFamily]
   * @param {boolean} [options.dark=false]
   * @param {Function} [options.onClick] - Called with (level) when a crumb is clicked
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      fontSize: 12,
      color: options.dark ? '#e0e2e7' : '#6B7280',
      activeColor: options.dark ? '#5c7cfa' : '#4c6ef5',
      separator: ' › ',
      padding: '6px 0',
      fontFamily: 'inherit',
      dark: false,
      onClick: null,
      ...options
    };
    if (options.dark && !options.color) {
      this.options.color = '#e0e2e7';
    }
    if (options.dark && !options.activeColor) {
      this.options.activeColor = '#5c7cfa';
    }
    this.element = null;
    this._items = [];
  }

  /**
   * Mount breadcrumb into the container (before other children)
   */
  mount() {
    if (this.element) return;

    this.element = createElement('div', {
      class: 'newchart-breadcrumb',
      style: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0',
        padding: this.options.padding,
        fontSize: this.options.fontSize + 'px',
        fontFamily: this.options.fontFamily,
        color: this.options.color,
        userSelect: 'none',
        lineHeight: '1.4'
      }
    });

    this._render();

    // Insert before the first child (before legend/SVG)
    this.container.insertBefore(this.element, this.container.firstChild);
  }

  /**
   * Update breadcrumb items and re-render
   * @param {{ label: string, level: number }[]} items
   */
  update(items) {
    this._items = items;
    if (!this.element) {
      this.mount();
    }
    this._render();

    // Hide when only root level (nothing to navigate back to)
    if (items.length <= 1) {
      this.element.style.display = 'none';
    } else {
      this.element.style.display = 'flex';
    }
  }

  /**
   * Render the breadcrumb trail
   */
  _render() {
    if (!this.element) return;
    this.element.innerHTML = '';

    this._items.forEach((item, index) => {
      const isLast = index === this._items.length - 1;

      const span = createElement('span', {
        textContent: item.label,
        style: {
          color: isLast ? this.options.color : this.options.activeColor,
          cursor: isLast ? 'default' : 'pointer',
          fontWeight: isLast ? '600' : '400',
          transition: 'opacity 0.12s'
        }
      });

      if (!isLast) {
        span.addEventListener('mouseenter', () => { span.style.opacity = '0.7'; });
        span.addEventListener('mouseleave', () => { span.style.opacity = '1'; });
        span.addEventListener('click', () => {
          if (typeof this.options.onClick === 'function') {
            this.options.onClick(item.level);
          }
        });
      }

      this.element.appendChild(span);

      // Separator
      if (!isLast) {
        const sep = createElement('span', {
          textContent: this.options.separator,
          style: {
            color: this.options.color,
            opacity: '0.4',
            padding: '0 2px'
          }
        });
        this.element.appendChild(sep);
      }
    });
  }

  /** Show the breadcrumb */
  show() {
    if (this.element) this.element.style.display = 'flex';
  }

  /** Hide the breadcrumb */
  hide() {
    if (this.element) this.element.style.display = 'none';
  }

  /** Remove from DOM and clean up */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this._items = [];
  }
}

export default Breadcrumb;
