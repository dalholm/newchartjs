/**
 * Base Chart class - all chart types extend this
 */

import { SVGRenderer, CanvasRenderer } from './Renderer.js';
import { deepMerge, debounce, formatNumber } from './utils.js';
import { DEFAULT_CONFIG } from './defaults.js';
import { resolveCSSTokens } from './CSSTokens.js';
import Tooltip from './Tooltip.js';
import Legend from './Legend.js';
import DataTable from './DataTable.js';
import { animate } from './Animation.js';

export class Chart {
  /**
   * Create a chart instance
   * @param {Element|string} element - DOM element or selector
   * @param {Object} config - Chart configuration
   */
  constructor(element, config = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;

    if (!this.element) {
      throw new Error('Chart element not found');
    }

    // Merge configs: defaults < JS config < CSS tokens
    this.config = deepMerge(DEFAULT_CONFIG, config);

    if (this.config.options?.cssTokens !== false) {
      const cssOverrides = resolveCSSTokens(this.element);
      this.config = deepMerge(this.config, cssOverrides);
    }

    this.initialConfig = JSON.parse(JSON.stringify(this.config));

    // Container setup
    this.container = document.createElement('div');
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.position = 'relative';
    this.container.setAttribute('role', 'img');
    this.container.setAttribute('aria-label',
      this.config.options.ariaLabel || `${this.config.type || 'data'} chart`
    );
    this.element.appendChild(this.container);

    // Dimensions
    this.width = 0;
    this.height = 0;
    this.updateDimensions();

    // Renderer setup (after dimensions so width/height are set)
    this.renderer = null;
    this.initRenderer();

    // Tooltip, legend, and data table
    this.tooltip = new Tooltip(this.container, this.config.style.tooltip);
    this.legend = null;
    this.dataTable = null;

    // Resize observer for responsiveness
    this.resizeObserver = null;
    this.resizeHandler = debounce(() => this.handleResize(), 150);

    if (this.config.options.responsive) {
      this.setupResizeObserver();
    }

    // Animation state
    this.animationCancels = [];
    this.isAnimating = false;

    // Track element event listeners for cleanup
    this._elementListeners = [];

    // Event listeners
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('mouseleave', this.onMouseLeave);

    // Initial render
    this.draw();
  }

  /**
   * Initialize the renderer (SVG or Canvas)
   */
  initRenderer() {
    const rendererType = this.config.options.renderer;

    if (rendererType === 'canvas' || (rendererType === 'auto' && this.shouldUseCanvas())) {
      this.renderer = new CanvasRenderer(this.container, this.width, this.height);
    } else {
      this.renderer = new SVGRenderer(this.container, this.width, this.height);
    }
  }

  /**
   * Check if canvas should be used (default SVG)
   */
  shouldUseCanvas() {
    // Use canvas for very large datasets
    const totalPoints = this.config.data.datasets.reduce((sum, ds) => {
      return sum + (ds.values ? ds.values.length : 0);
    }, 0);

    return totalPoints > 5000;
  }

  /**
   * Update container dimensions.
   * Temporarily hides chart content so getBoundingClientRect returns the
   * element's CSS-defined size, not a size inflated by its own children
   * (legend, SVG, etc.). This prevents the resize-loop where content pushes
   * the element taller → ResizeObserver fires → re-render at larger size → repeat.
   */
  updateDimensions() {
    // Hide children so they don't inflate the measurement
    const children = Array.from(this.element.children);
    const prevDisplay = children.map(c => c.style.display);
    children.forEach(c => { c.style.display = 'none'; });

    const rect = this.element.getBoundingClientRect();
    this.width = Math.max(rect.width, 300) || 600;
    this.height = Math.max(rect.height, 300) || 400;

    // Restore children
    children.forEach((c, i) => { c.style.display = prevDisplay[i]; });

    if (this.renderer) {
      this.renderer.width = this.width;
      this.renderer.height = this.height;
    }
  }

  /**
   * Setup resize observer for responsiveness
   */
  setupResizeObserver() {
    if (!('ResizeObserver' in window)) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeHandler();
    });

    this.resizeObserver.observe(this.element);
  }

  /**
   * Handle resize event
   */
  handleResize() {
    const oldWidth = this.width;
    const oldHeight = this.height;

    this.updateDimensions();

    if (this.width !== oldWidth || this.height !== oldHeight) {
      // Recreate renderer
      if (this.renderer) {
        this.renderer.destroy();
      }
      this.initRenderer();
      this.draw();
    }
  }

  /**
   * Update chart data and/or config
   * @param {Object} config - New config (merged with existing)
   */
  update(config = {}) {
    // Cancel any ongoing animations
    this.cancelAnimations();

    this.config = deepMerge(this.config, config);
    this.draw();
  }

  /**
   * Draw the chart (full lifecycle)
   */
  draw() {
    // Cancel previous animations
    this.cancelAnimations();

    // Remove previously attached element listeners
    this.removeElementListeners();

    // Validate data
    if (!this.config.data || !this.config.data.datasets) {
      return;
    }

    // Clear renderer
    this.renderer.clear();

    // Setup legend
    this.setupLegend();

    // Render background
    if (this.config.style.background) {
      this.renderer.rect(0, 0, this.width, this.height, {
        fill: this.config.style.background
      });
    }

    // Call subclass render method
    this.render();

    // Setup data table if configured
    this.setupDataTable();

    // Animate if configured
    if (this.config.style.animation?.duration > 0) {
      this.animate();
    }
  }

  /**
   * Animate chart (override in subclasses)
   */
  animate() {
    // Override in subclasses
  }

  /**
   * Calculate standard chart layout for axis-based charts (bar, line, area)
   * @returns {Object} Layout dimensions and flags
   */
  calculateLayout() {
    const padding = this.config.options.padding || 20;
    const hasXAxis = this.config.options.axis?.x?.enabled !== false;
    const hasYAxis = this.config.options.axis?.y?.enabled !== false;

    const topSpace = this.config.options.legend?.enabled ? 40 : 0;
    const bottomSpace = hasXAxis ? 40 : padding;
    const leftSpace = hasYAxis ? 60 : padding;
    const rightSpace = padding;

    const chartWidth = this.width - leftSpace - rightSpace;
    const chartHeight = this.height - topSpace - bottomSpace - padding;

    return {
      padding,
      chartX: leftSpace,
      chartY: topSpace,
      chartWidth,
      chartHeight,
      leftSpace,
      rightSpace,
      topSpace,
      bottomSpace,
      hasXAxis,
      hasYAxis
    };
  }

  /**
   * Render chart content (must be implemented by subclasses)
   */
  render() {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Setup legend
   */
  setupLegend() {
    if (!this.config.options.legend?.enabled) return;

    const items = this.config.data.datasets.map((dataset, index) => ({
      key: dataset.key || dataset.label || `Series ${index + 1}`,
      label: dataset.label || `Series ${index + 1}`,
      color: dataset.color || this.getPaletteColor(index),
      style: dataset.dash ? 'dashed' : undefined,
      ref: dataset.ref || false
    }));

    const legendOptions = {
      ...this.config.options.legend,
      onToggle: (key, visible, visibilityMap) => {
        this._legendVisibility = visibilityMap;
        // Re-render chart with updated visibility
        this.cancelAnimations();
        this.removeElementListeners();
        this.renderer.clear();
        if (this.config.style.background) {
          this.renderer.rect(0, 0, this.width, this.height, {
            fill: this.config.style.background
          });
        }
        this.render();
        if (this.config.style.animation?.duration > 0) {
          this.animate();
        }
      }
    };

    if (this.legend) {
      this.legend.update(items);
    } else {
      this.legend = new Legend(this.element, items, legendOptions);
      this.legend.mount();
    }

    // Store visibility reference
    this._legendVisibility = this.legend.getVisibility();
  }

  /**
   * Check if a dataset is visible via legend toggle
   * @param {Object} dataset - Dataset object
   * @param {number} index - Dataset index
   * @returns {boolean} Whether dataset should be rendered
   */
  isDatasetVisible(dataset, index) {
    if (!this._legendVisibility) return true;
    const key = dataset.key || dataset.label || `Series ${index + 1}`;
    return this._legendVisibility[key] !== false;
  }

  /**
   * Setup data table component
   */
  setupDataTable() {
    const tableOpts = this.config.options.table;
    if (!tableOpts?.enabled) return;

    const viewMode = tableOpts.viewMode || 'split';

    // Hide chart renderer and container when table-only mode
    if (viewMode === 'table') {
      this.container.style.display = 'none';
    } else {
      this.container.style.display = '';
    }

    if (!this.dataTable) {
      this.dataTable = new DataTable(this.element, {
        ...tableOpts,
        fontFamily: this.config.style.fontFamily,
        monoFamily: this.config.style.monoFamily
      });

      // Wire table→chart hover sync
      this.dataTable.onHover(
        (index) => {
          if (typeof this.highlightColumn === 'function') {
            this.highlightColumn(index);
          } else if (typeof this.highlightSlice === 'function') {
            this.highlightSlice(index);
          }
        },
        () => {
          if (typeof this.clearHighlight === 'function') {
            this.clearHighlight();
          }
        }
      );
    }

    // Wire chart→table hover via onHover option (wrap only once)
    if (!this._dataTableHoverWrapped) {
      const origOnHover = this.config.options.onHover;
      const origOnHoverEnd = this.config.options.onHoverEnd;
      this.config.options.onHover = (index, label) => {
        if (this.dataTable) this.dataTable.highlightRow(index);
        if (origOnHover) origOnHover(index, label);
      };
      this.config.options.onHoverEnd = () => {
        if (this.dataTable) this.dataTable.clearHighlight();
        if (origOnHoverEnd) origOnHoverEnd();
      };
      this._dataTableHoverWrapped = true;
    }

    // Pass data to table
    this.dataTable.setData(this.config.data, {
      columns: tableOpts.columns,
      colors: this.config.data.datasets.map((ds, i) => ds.color || this.getPaletteColor(i))
    });

    this.dataTable.setViewMode(viewMode);
  }

  /**
   * Get color from palette (CSS token palette overrides default)
   * @param {number} index - Index
   * @returns {string} Color
   */
  getPaletteColor(index) {
    if (this.config.palette && this.config.palette.length > 0) {
      return this.config.palette[index % this.config.palette.length];
    }

    const colors = [
      '#4c6ef5', '#0ca678', '#f08c00', '#e03131', '#7048e8',
      '#1098ad', '#d6336c', '#5c7cfa', '#20c997', '#fcc419'
    ];
    return colors[index % colors.length];
  }

  /**
   * Animate a value
   * @param {Object} options - Animation options
   * @returns {Function} Cancel function
   */
  animateValue(options) {
    const cancel = animate(options);
    this.animationCancels.push(cancel);
    return cancel;
  }

  /**
   * Cancel all animations
   */
  cancelAnimations() {
    this.animationCancels.forEach(cancel => cancel());
    this.animationCancels = [];
  }

  /**
   * Add an event listener to a chart element with automatic cleanup tracking
   * @param {Element} element - DOM element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  addElementListener(element, event, handler) {
    element.addEventListener(event, handler);
    this._elementListeners.push({ element, event, handler });
  }

  /**
   * Remove all tracked element event listeners
   */
  removeElementListeners() {
    this._elementListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this._elementListeners = [];
  }

  /**
   * Show tooltip
   * @param {MouseEvent} event - Mouse event
   * @param {string|Object} content - Tooltip content
   */
  showTooltip(event, content) {
    const rect = this.container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.config.options.tooltip?.enabled) {
      this.tooltip.show(x, y, content);
    }
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    this.tooltip.hide();
  }

  /**
   * Mouse move handler
   * @param {MouseEvent} event - Mouse event
   */
  onMouseMove(event) {
    this.tooltip.follow(event);
    this.onChartMouseMove?.(event);
  }

  /**
   * Mouse leave handler
   * @param {MouseEvent} event - Mouse event
   */
  onMouseLeave(event) {
    this.hideTooltip();
    this.onChartMouseLeave?.(event);
  }

  /**
   * Destroy chart
   */
  destroy() {
    this.cancelAnimations();
    this.removeElementListeners();

    if (this.resizeHandler && this.resizeHandler.cancel) {
      this.resizeHandler.cancel();
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.tooltip) {
      this.tooltip.destroy();
    }

    if (this.legend) {
      this.legend.destroy();
    }

    if (this.dataTable) {
      this.dataTable.destroy();
    }

    if (this.renderer) {
      this.renderer.destroy();
    }

    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('mouseleave', this.onMouseLeave);

    if (this.element && this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /**
   * Export chart as PNG (SVG only)
   * @returns {Promise<string>} Data URL
   */
  async toPNG() {
    if (!(this.renderer instanceof SVGRenderer)) {
      throw new Error('PNG export only works with SVG renderer');
    }

    return new Promise((resolve, reject) => {
      try {
        const svg = this.renderer.getSVG();
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);

        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, this.width, this.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = () => {
          reject(new Error('Failed to render PNG'));
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export chart as SVG (SVG only)
   * @returns {string} SVG string
   */
  toSVG() {
    if (!(this.renderer instanceof SVGRenderer)) {
      throw new Error('SVG export only works with SVG renderer');
    }

    const svg = this.renderer.getSVG();
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
  }
}

export default Chart;
