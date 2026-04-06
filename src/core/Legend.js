/**
 * Interactive legend component for charts
 */

import { createElement } from './utils.js';

export class Legend {
  /**
   * Create a legend instance
   * @param {Element} container - Container element
   * @param {Object[]} items - Legend items
   * @param {Object} options - Legend options
   */
  constructor(container, items = [], options = {}) {
    this.container = container;
    this.items = items;
    this.options = {
      position: 'top',
      enabled: true,
      fontSize: 11,
      color: '#172b4d',
      marker: { size: 10, height: 3 },
      interactive: true,
      dark: false,
      ...options
    };

    this.element = null;
    this._visibility = {};
    this._onToggle = options.onToggle || null;

    // Initialize visibility state
    items.forEach(item => {
      this._visibility[item.key || item.label] = true;
    });
  }

  /**
   * Mount legend to container
   */
  mount() {
    if (!this.options.enabled || this.element) return;

    this.element = createElement('div', {
      class: 'newchart-legend',
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        padding: '10px 0',
        fontSize: this.options.fontSize + 'px',
        color: this.options.color,
        fontFamily: 'inherit',
        justifyContent: this.getJustifyContent()
      }
    });

    this._renderItems();

    if (this.options.position === 'top') {
      this.container.insertBefore(this.element, this.container.firstChild);
    } else if (this.options.position === 'bottom') {
      this.container.appendChild(this.element);
    } else if (this.options.position === 'left' || this.options.position === 'right') {
      this.element.style.flexDirection = 'column';
      this.container.style.display = 'flex';
      if (this.options.position === 'left') {
        this.container.insertBefore(this.element, this.container.firstChild);
      } else {
        this.container.appendChild(this.element);
      }
    }
  }

  /**
   * Render legend item buttons
   */
  _renderItems() {
    if (!this.element) return;
    this.element.innerHTML = '';

    this.items.forEach(item => {
      const key = item.key || item.label;
      const vis = this._visibility[key] !== false;

      const dk = this.options.dark;
      const itemEl = createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          fontSize: this.options.fontSize + 'px',
          fontFamily: 'inherit',
          border: `1px solid ${vis ? (dk ? '#2d3139' : '#dfe1e6') : (dk ? '#252830' : '#ebecf0')}`,
          borderRadius: '3px',
          cursor: 'pointer',
          background: vis ? (dk ? '#1a1d23' : '#ffffff') : (dk ? '#1e2028' : '#f8f9fb'),
          color: vis ? this.options.color : (dk ? '#6b7280' : '#b3bac5'),
          opacity: vis ? '1' : '0.5',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
          userSelect: 'none'
        }
      });

      // Marker swatch — thin line style like prototype
      const marker = createElement('span', {
        style: {
          width: (this.options.marker.size || 10) + 'px',
          height: (this.options.marker.height || 3) + 'px',
          borderRadius: '2px',
          backgroundColor: vis ? item.color : '#b3bac5',
          flexShrink: '0',
          transition: 'background-color 0.15s'
        }
      });

      // Label
      const label = createElement('span', {
        textContent: item.label,
        style: { whiteSpace: 'nowrap' }
      });

      itemEl.appendChild(marker);
      itemEl.appendChild(label);

      // Reference indicator for dashed/compare series
      if (item.style === 'dashed' || item.ref) {
        const refTag = createElement('span', {
          textContent: '(ref)',
          style: {
            fontSize: '9px',
            color: dk ? '#6b7280' : '#8993a4',
            marginLeft: '2px'
          }
        });
        itemEl.appendChild(refTag);
      }

      // Click handler for toggling
      if (this.options.interactive) {
        itemEl.addEventListener('click', () => {
          this._visibility[key] = !vis;
          this._renderItems();

          if (typeof item.onClick === 'function') {
            item.onClick(item);
          }
          if (typeof this._onToggle === 'function') {
            this._onToggle(key, this._visibility[key], this._visibility);
          }
        });
      } else if (typeof item.onClick === 'function') {
        itemEl.addEventListener('click', () => item.onClick(item));
      }

      this.element.appendChild(itemEl);
    });
  }

  /**
   * Get justify-content value based on position
   */
  getJustifyContent() {
    switch (this.options.position) {
      case 'left':
        return 'flex-start';
      case 'right':
        return 'flex-end';
      case 'center':
        return 'center';
      case 'top':
      case 'bottom':
      default:
        return 'center';
    }
  }

  /**
   * Check if a series key is visible
   * @param {string} key - Series key
   * @returns {boolean} Visibility state
   */
  isVisible(key) {
    return this._visibility[key] !== false;
  }

  /**
   * Get full visibility map
   * @returns {Object} Visibility state map
   */
  getVisibility() {
    return { ...this._visibility };
  }

  /**
   * Set visibility for a key
   * @param {string} key - Series key
   * @param {boolean} visible - Visibility state
   */
  setVisibility(key, visible) {
    this._visibility[key] = visible;
    this._renderItems();
  }

  /**
   * Update legend items
   * @param {Object[]} items - New items
   */
  update(items) {
    this.items = items;
    // Preserve existing visibility, add new keys as visible
    items.forEach(item => {
      const key = item.key || item.label;
      if (this._visibility[key] === undefined) {
        this._visibility[key] = true;
      }
    });
    if (this.element) {
      this._renderItems();
    } else {
      this.destroy();
      this.mount();
    }
  }

  /**
   * Show legend
   */
  show() {
    if (this.element) {
      this.element.style.display = 'flex';
    }
  }

  /**
   * Hide legend
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  /**
   * Destroy legend
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

export default Legend;
