/**
 * Legend component for charts
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
      fontSize: 12,
      color: '#374151',
      marker: { size: 8 },
      ...options
    };

    this.element = null;
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
        gap: '20px',
        padding: '10px 0',
        fontSize: this.options.fontSize + 'px',
        color: this.options.color,
        fontFamily: 'inherit',
        justifyContent: this.getJustifyContent()
      }
    });

    this.items.forEach(item => {
      const itemEl = createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer'
        }
      });

      // Marker
      const marker = createElement('div', {
        style: {
          width: this.options.marker.size + 'px',
          height: this.options.marker.size + 'px',
          backgroundColor: item.color,
          borderRadius: '2px',
          flexShrink: 0
        }
      });

      // Label
      const label = createElement('span', {
        textContent: item.label,
        style: {
          whiteSpace: 'nowrap'
        }
      });

      itemEl.appendChild(marker);
      itemEl.appendChild(label);

      // Click handler for toggling datasets (optional)
      itemEl.addEventListener('click', () => {
        item.onClick?.(item);
      });

      this.element.appendChild(itemEl);
    });

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
   * Update legend items
   * @param {Object[]} items - New items
   */
  update(items) {
    this.items = items;
    this.destroy();
    this.mount();
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
