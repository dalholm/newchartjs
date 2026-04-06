
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.NewChart = factory());
})(this, (function () { 'use strict';

  /**
   * Utility functions for the charting library
   */

  /**
   * Merge two objects deeply
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  function deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (
          source[key] !== null &&
          typeof source[key] === 'object' &&
          !Array.isArray(source[key]) &&
          !(source[key] instanceof Date)
        ) {
          result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Format a number with optional decimal places
   * @param {number} num - Number to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted number
   */
  function formatNumber(num, decimals = 0) {
    if (typeof num !== 'number') return String(num);
    return Number(num.toFixed(decimals)).toLocaleString();
  }

  /**
   * Debounce a function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;

    const executedFunction = function (...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };

    executedFunction.cancel = () => {
      clearTimeout(timeout);
    };

    return executedFunction;
  }

  /**
   * Create a DOM element with attributes
   * @param {string} tag - Tag name
   * @param {Object} attrs - Attributes object
   * @param {string} ns - Namespace (for SVG)
   * @returns {Element} Created element
   */
  function createElement(tag, attrs = {}, ns = null) {
    const element = ns
      ? document.createElementNS(ns, tag)
      : document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'class') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else if (ns) {
        element.setAttribute(key, value);
      } else {
        element[key] = value;
      }
    }

    return element;
  }

  /**
   * Calculate min and max values in an array
   * @param {number[]} values - Array of numbers
   * @returns {Object} { min, max }
   */
  function getMinMax(values) {
    if (!values || values.length === 0) {
      return { min: 0, max: 0 };
    }

    let min = values[0];
    let max = values[0];
    for (let i = 1; i < values.length; i++) {
      const v = values[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }

    return { min, max };
  }

  /**
   * Generate evenly spaced scale values
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} steps - Number of steps
   * @returns {number[]} Array of scale values
   */
  function generateScale(min, max, steps = 5) {
    const range = max - min;
    if (range === 0 || steps <= 1) {
      return [min];
    }

    // Nice-number algorithm for ERP-quality scale ticks
    const roughStep = range / (steps - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const fraction = roughStep / magnitude;

    let niceStep;
    if (fraction <= 1) niceStep = 1 * magnitude;
    else if (fraction <= 2) niceStep = 2 * magnitude;
    else if (fraction <= 2.5) niceStep = 2.5 * magnitude;
    else if (fraction <= 5) niceStep = 5 * magnitude;
    else niceStep = 10 * magnitude;

    const niceMin = Math.floor(min / niceStep) * niceStep;
    const niceMax = Math.ceil(max / niceStep) * niceStep;

    const scale = [];
    for (let v = niceMin; v <= niceMax + niceStep * 0.5; v += niceStep) {
      scale.push(Math.round(v * 1e10) / 1e10); // avoid floating-point artifacts
    }

    return scale;
  }

  /**
   * Bezier curve interpolation for smooth chart lines
   * @param {Array} points - Array of [x, y] coordinate pairs
   * @param {number} tension - Curve tension (0-1)
   * @returns {string} SVG path data
   */
  function getBezierPath(points, tension = 0.4) {
    if (points.length < 2) return '';

    const path = [`M ${points[0][0]} ${points[0][1]}`];

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension;

      path.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2[0]} ${p2[1]}`);
    }

    return path.join(' ');
  }

  /**
   * Monotone cubic interpolation (Fritsch-Carlson) for smooth lines that never overshoot data points.
   * Ideal for business charts where accuracy matters more than artistic smoothness.
   * @param {Array} points - Array of [x, y] coordinate pairs
   * @returns {string} SVG path data
   */
  function getMonotonePath(points) {
    const n = points.length;
    if (n < 2) return '';
    if (n === 2) return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`;

    // Step 1: compute slopes (deltas) and secants
    const dx = [];
    const dy = [];
    const m = []; // tangent slopes
    for (let i = 0; i < n - 1; i++) {
      dx.push(points[i + 1][0] - points[i][0]);
      dy.push(points[i + 1][1] - points[i][1]);
      m.push(dx[i] === 0 ? 0 : dy[i] / dx[i]);
    }

    // Step 2: initialize tangent values as average of secants
    const tangents = [m[0]];
    for (let i = 1; i < n - 1; i++) {
      if (m[i - 1] * m[i] <= 0) {
        // Sign change or zero — flat tangent to prevent overshoot
        tangents.push(0);
      } else {
        tangents.push((m[i - 1] + m[i]) / 2);
      }
    }
    tangents.push(m[n - 2]);

    // Step 3: Fritsch-Carlson monotonicity constraint
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) {
        tangents[i] = 0;
        tangents[i + 1] = 0;
      } else {
        const alpha = tangents[i] / m[i];
        const beta = tangents[i + 1] / m[i];
        // Restrict to circle of radius 3 to ensure monotonicity
        const s = alpha * alpha + beta * beta;
        if (s > 9) {
          const tau = 3 / Math.sqrt(s);
          tangents[i] = tau * alpha * m[i];
          tangents[i + 1] = tau * beta * m[i];
        }
      }
    }

    // Step 4: build cubic bezier path from hermite tangents
    const path = [`M ${points[0][0]} ${points[0][1]}`];
    for (let i = 0; i < n - 1; i++) {
      const seg = dx[i] / 3;
      const cp1x = points[i][0] + seg;
      const cp1y = points[i][1] + tangents[i] * seg;
      const cp2x = points[i + 1][0] - seg;
      const cp2y = points[i + 1][1] - tangents[i + 1] * seg;
      path.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${points[i + 1][0]} ${points[i + 1][1]}`);
    }

    return path.join(' ');
  }

  /**
   * Get cursor position relative to an element
   * @param {MouseEvent} event - Mouse event
   * @param {Element} element - Reference element
   * @returns {Object} { x, y } position
   */
  function getCursorPosition(event, element) {
    const rect = element.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  /**
   * Get device pixel ratio for retina displays
   * @returns {number} Pixel ratio
   */
  function getPixelRatio() {
    return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  }

  /**
   * Renderer base class and implementations for SVG and Canvas
   */


  /**
   * Base Renderer class
   */
  class Renderer {
    constructor(container, width, height, options = {}) {
      this.container = container;
      this.width = width;
      this.height = height;
      this.options = options;
    }

    render() {
      throw new Error('render() must be implemented by subclass');
    }

    clear() {
      throw new Error('clear() must be implemented by subclass');
    }

    destroy() {
      throw new Error('destroy() must be implemented by subclass');
    }
  }

  /**
   * SVG Renderer - Primary renderer for clean vector graphics
   */
  class SVGRenderer extends Renderer {
    constructor(container, width, height, options = {}) {
      super(container, width, height, options);
      this.svg = null;
      this.elements = [];
      this.init();
    }

    init() {
      // Clear container
      this.container.innerHTML = '';

      // Create SVG element
      this.svg = createElement('svg', {
        width: this.width,
        height: this.height,
        viewBox: `0 0 ${this.width} ${this.height}`,
        style: {
          display: 'block',
          maxWidth: '100%',
          height: 'auto'
        }
      }, 'http://www.w3.org/2000/svg');

      this.container.appendChild(this.svg);
    }

    /**
     * Create an SVG element
     * @param {string} tag - SVG tag name
     * @param {Object} attrs - Attributes
     * @returns {Element} SVG element
     */
    createElement(tag, attrs = {}) {
      const element = createElement(tag, attrs, 'http://www.w3.org/2000/svg');
      this.elements.push(element);
      return element;
    }

    /**
     * Draw a circle
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} r - Radius
     * @param {Object} style - Style object
     * @returns {Element} Circle element
     */
    circle(x, y, r, style = {}) {
      const circle = this.createElement('circle', {
        cx: x,
        cy: y,
        r: r,
        fill: style.fill || 'none',
        stroke: style.stroke || 'none',
        'stroke-width': style.strokeWidth || 1,
        opacity: style.opacity !== undefined ? style.opacity : 1
      });

      this.svg.appendChild(circle);
      return circle;
    }

    /**
     * Draw a rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} style - Style object
     * @returns {Element} Rect element
     */
    rect(x, y, width, height, style = {}) {
      const r = style.borderRadius || 0;
      const topOnly = style.borderRadiusTop || false;

      // Use path for top-only rounding since SVG rx rounds all corners
      if (r > 0 && topOnly) {
        const clampedR = Math.min(r, width / 2, height / 2);
        const d = `M ${x + clampedR} ${y}`
          + ` Q ${x} ${y} ${x} ${y + clampedR}`
          + ` L ${x} ${y + height}`
          + ` L ${x + width} ${y + height}`
          + ` L ${x + width} ${y + clampedR}`
          + ` Q ${x + width} ${y} ${x + width - clampedR} ${y}`
          + ` Z`;
        const path = this.createElement('path', {
          d,
          fill: style.fill || 'none',
          stroke: style.stroke || 'none',
          'stroke-width': style.strokeWidth || 1,
          opacity: style.opacity !== undefined ? style.opacity : 1
        });
        this.svg.appendChild(path);
        return path;
      }

      const rect = this.createElement('rect', {
        x: x,
        y: y,
        width: width,
        height: height,
        rx: r,
        fill: style.fill || 'none',
        stroke: style.stroke || 'none',
        'stroke-width': style.strokeWidth || 1,
        opacity: style.opacity !== undefined ? style.opacity : 1
      });

      this.svg.appendChild(rect);
      return rect;
    }

    /**
     * Draw a line
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {Object} style - Style object
     * @returns {Element} Line element
     */
    line(x1, y1, x2, y2, style = {}) {
      const attrs = {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        stroke: style.stroke || '#000',
        'stroke-width': style.strokeWidth || 1,
        'stroke-linecap': style.strokeLinecap || 'butt',
        opacity: style.opacity !== undefined ? style.opacity : 1
      };

      if (style.strokeDasharray) {
        attrs['stroke-dasharray'] = style.strokeDasharray;
      }

      const line = this.createElement('line', attrs);
      this.svg.appendChild(line);
      return line;
    }

    /**
     * Draw a polyline
     * @param {Array} points - Array of [x, y] points
     * @param {Object} style - Style object
     * @returns {Element} Polyline element
     */
    polyline(points, style = {}) {
      const pointsStr = points.map(p => `${p[0]},${p[1]}`).join(' ');
      const polyline = this.createElement('polyline', {
        points: pointsStr,
        fill: style.fill || 'none',
        stroke: style.stroke || '#000',
        'stroke-width': style.strokeWidth || 1,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        opacity: style.opacity !== undefined ? style.opacity : 1
      });

      this.svg.appendChild(polyline);
      return polyline;
    }

    /**
     * Draw a path
     * @param {string} d - Path data
     * @param {Object} style - Style object
     * @returns {Element} Path element
     */
    path(d, style = {}) {
      const attrs = {
        d: d,
        fill: style.fill || 'none',
        stroke: style.stroke || 'none',
        'stroke-width': style.strokeWidth || 1,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        opacity: style.opacity !== undefined ? style.opacity : 1
      };

      if (style.strokeDasharray) {
        attrs['stroke-dasharray'] = style.strokeDasharray;
      }

      const path = this.createElement('path', attrs);
      this.svg.appendChild(path);
      return path;
    }

    /**
     * Draw text
     * @param {string} text - Text content
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} style - Style object
     * @returns {Element} Text element
     */
    text(text, x, y, style = {}) {
      const attrs = {
        x: x,
        y: y,
        fill: style.fill || '#000',
        'font-family': style.fontFamily || 'sans-serif',
        'font-size': style.fontSize || 12,
        'text-anchor': style.textAnchor || 'start',
        'dominant-baseline': style.dominantBaseline || 'hanging',
        opacity: style.opacity !== undefined ? style.opacity : 1
      };

      if (style.fontWeight) {
        attrs['font-weight'] = style.fontWeight;
      }

      const textEl = this.createElement('text', attrs);
      textEl.textContent = text;
      this.svg.appendChild(textEl);
      return textEl;
    }

    /**
     * Draw an arc (for pie charts)
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} r - Radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {number} innerRadius - Inner radius (0 for pie, > 0 for donut)
     * @param {Object} style - Style object
     * @returns {Element} Path element
     */
    arc(cx, cy, r, startAngle, endAngle, innerRadius = 0, style = {}) {
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

      let d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;

      if (innerRadius > 0) {
        const x3 = cx + innerRadius * Math.cos(endAngle);
        const y3 = cy + innerRadius * Math.sin(endAngle);
        const x4 = cx + innerRadius * Math.cos(startAngle);
        const y4 = cy + innerRadius * Math.sin(startAngle);

        d += ` L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
      } else {
        d += ` L ${cx} ${cy} Z`;
      }

      return this.path(d, style);
    }

    /**
     * Create a linear gradient definition for area fills
     * @param {string} color - Base color
     * @param {string} id - Gradient ID
     * @param {number} topOpacity - Opacity at the top (0-1)
     * @param {number} bottomOpacity - Opacity at the bottom (0-1)
     * @returns {string|null} Gradient fill URL, or null if not SVG
     */
    createGradient(color, id, topOpacity = 0.12, bottomOpacity = 0.01) {
      let defs = this.svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svg.insertBefore(defs, this.svg.firstChild);
      }

      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', id);
      gradient.setAttribute('x1', '0');
      gradient.setAttribute('y1', '0');
      gradient.setAttribute('x2', '0');
      gradient.setAttribute('y2', '1');

      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', color);
      stop1.setAttribute('stop-opacity', String(topOpacity));

      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', color);
      stop2.setAttribute('stop-opacity', String(bottomOpacity));

      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);

      return `url(#${id})`;
    }

    /**
     * Clear all rendered elements
     */
    clear() {
      if (this.svg) {
        this.svg.innerHTML = '';
      }
      this.elements = [];
    }

    /**
     * Destroy renderer
     */
    destroy() {
      if (this.svg && this.svg.parentNode) {
        this.svg.parentNode.removeChild(this.svg);
      }
      this.svg = null;
      this.elements = [];
    }

    /**
     * Get SVG element
     */
    getSVG() {
      return this.svg;
    }
  }

  /**
   * Canvas Renderer - Fallback for large datasets
   */
  class CanvasRenderer extends Renderer {
    constructor(container, width, height, options = {}) {
      super(container, width, height, options);
      this.canvas = null;
      this.ctx = null;
      this.pixelRatio = getPixelRatio();
      this.init();
    }

    init() {
      // Clear container
      this.container.innerHTML = '';

      // Create canvas
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.width * this.pixelRatio;
      this.canvas.height = this.height * this.pixelRatio;
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
      this.canvas.style.display = 'block';
      this.canvas.style.maxWidth = '100%';

      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.ctx.scale(this.pixelRatio, this.pixelRatio);

      // Set default styles
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }

    /**
     * Draw a circle
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} r - Radius
     * @param {Object} style - Style object
     */
    circle(x, y, r, style = {}) {
      const prevAlpha = this.ctx.globalAlpha;
      if (style.opacity !== undefined) this.ctx.globalAlpha = style.opacity;

      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);

      if (style.fill) {
        this.ctx.fillStyle = style.fill;
        this.ctx.fill();
      }

      if (style.stroke) {
        this.ctx.strokeStyle = style.stroke;
        this.ctx.lineWidth = style.strokeWidth || 1;
        this.ctx.stroke();
      }

      this.ctx.globalAlpha = prevAlpha;
    }

    /**
     * Draw a rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} style - Style object
     */
    rect(x, y, width, height, style = {}) {
      const prevAlpha = this.ctx.globalAlpha;
      if (style.opacity !== undefined) this.ctx.globalAlpha = style.opacity;

      const radius = style.borderRadius || 0;

      const topOnly = style.borderRadiusTop || false;

      if (radius > 0) {
        const r = Math.min(radius, width / 2, height / 2);
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + width - r, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        if (topOnly) {
          // Flat bottom corners
          this.ctx.lineTo(x + width, y + height);
          this.ctx.lineTo(x, y + height);
        } else {
          this.ctx.lineTo(x + width, y + height - r);
          this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
          this.ctx.lineTo(x + r, y + height);
          this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        }
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
      } else {
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
      }

      if (style.fill) {
        this.ctx.fillStyle = style.fill;
        this.ctx.fill();
      }

      if (style.stroke) {
        this.ctx.strokeStyle = style.stroke;
        this.ctx.lineWidth = style.strokeWidth || 1;
        this.ctx.stroke();
      }

      this.ctx.globalAlpha = prevAlpha;
    }

    /**
     * Draw a line
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {Object} style - Style object
     */
    line(x1, y1, x2, y2, style = {}) {
      this.ctx.beginPath();
      if (style.strokeDasharray) {
        this.ctx.setLineDash(style.strokeDasharray.split(/[\s,]+/).map(Number));
      } else {
        this.ctx.setLineDash([]);
      }
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.strokeStyle = style.stroke || '#000';
      this.ctx.lineWidth = style.strokeWidth || 1;
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    /**
     * Draw a polyline
     * @param {Array} points - Array of [x, y] points
     * @param {Object} style - Style object
     */
    polyline(points, style = {}) {
      if (points.length === 0) return;

      this.ctx.beginPath();
      this.ctx.moveTo(points[0][0], points[0][1]);

      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i][0], points[i][1]);
      }

      if (style.fill) {
        this.ctx.fillStyle = style.fill;
        this.ctx.fill();
      }

      if (style.stroke) {
        this.ctx.strokeStyle = style.stroke;
        this.ctx.lineWidth = style.strokeWidth || 1;
        this.ctx.stroke();
      }
    }

    /**
     * Draw a path
     * @param {string} d - SVG path data string
     * @param {Object} style - Style object
     */
    path(d, style = {}) {
      const path2d = new Path2D(d);

      this.ctx.globalAlpha = style.opacity !== undefined ? style.opacity : 1;

      if (style.strokeDasharray) {
        this.ctx.setLineDash(style.strokeDasharray.split(/[\s,]+/).map(Number));
      } else {
        this.ctx.setLineDash([]);
      }

      if (style.fill && style.fill !== 'none') {
        this.ctx.fillStyle = style.fill;
        this.ctx.fill(path2d);
      }

      if (style.stroke && style.stroke !== 'none') {
        this.ctx.strokeStyle = style.stroke;
        this.ctx.lineWidth = style.strokeWidth || 1;
        this.ctx.stroke(path2d);
      }

      this.ctx.globalAlpha = 1;
      this.ctx.setLineDash([]);
    }

    /**
     * Draw text
     * @param {string} text - Text content
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} style - Style object
     */
    text(text, x, y, style = {}) {
      this.ctx.fillStyle = style.fill || '#000';
      this.ctx.font = `${style.fontSize || 12}px ${style.fontFamily || 'sans-serif'}`;
      this.ctx.textAlign = style.textAlign || 'left';
      this.ctx.textBaseline = style.textBaseline || 'top';
      this.ctx.fillText(text, x, y);
    }

    /**
     * Draw an arc
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} r - Radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {number} innerRadius - Inner radius (0 for pie)
     * @param {Object} style - Style object
     */
    arc(cx, cy, r, startAngle, endAngle, innerRadius = 0, style = {}) {
      this.ctx.beginPath();

      if (innerRadius > 0) {
        // Donut
        this.ctx.arc(cx, cy, r, startAngle, endAngle);
        this.ctx.lineTo(cx + innerRadius * Math.cos(endAngle), cy + innerRadius * Math.sin(endAngle));
        this.ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
        this.ctx.closePath();
      } else {
        // Pie
        this.ctx.moveTo(cx, cy);
        this.ctx.arc(cx, cy, r, startAngle, endAngle);
        this.ctx.closePath();
      }

      if (style.fill) {
        this.ctx.fillStyle = style.fill;
        this.ctx.fill();
      }

      if (style.stroke) {
        this.ctx.strokeStyle = style.stroke;
        this.ctx.lineWidth = style.strokeWidth || 1;
        this.ctx.stroke();
      }
    }

    /**
     * Clear canvas
     */
    clear() {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Destroy renderer
     */
    destroy() {
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
      this.canvas = null;
      this.ctx = null;
    }

    /**
     * Get canvas element
     */
    getCanvas() {
      return this.canvas;
    }
  }

  /**
   * Default configuration and styling for charts
   */

  const PALETTE = [
    '#4c6ef5', // Primary blue
    '#0ca678', // Success green
    '#f08c00', // Warning orange
    '#e03131', // Danger red
    '#7048e8', // Purple
    '#1098ad', // Teal
    '#d6336c', // Pink
    '#5c7cfa', // Light blue
    '#20c997', // Mint
    '#fcc419'  // Yellow
  ];

  /**
   * Compare/previous-period color
   */
  const COMPARE_COLOR = '#b3bac5';

  /**
   * Default configuration for all charts
   */
  const DEFAULT_CONFIG = {
    type: 'bar',
    data: {
      labels: [],
      datasets: []
    },
    style: {
      background: '#ffffff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      monoFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      fontSize: 12,
      fontColor: '#374151',
      grid: {
        color: '#E5E7EB',
        width: 1
      },
      axis: {
        color: '#374151',
        width: 1,
        fontSize: 12
      },
      animation: {
        duration: 600,
        easing: 'easeOutCubic'
      },
      tooltip: {
        background: '#1F2937',
        color: '#FFFFFF',
        fontSize: 12,
        padding: 8,
        borderRadius: 4,
        shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      },
      legend: {
        fontSize: 12,
        color: '#374151',
        marker: { size: 8 }
      }
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      legend: {
        position: 'top',
        enabled: true
      },
      tooltip: {
        enabled: true
      },
      padding: 20,
      theme: 'light', // 'light', 'dark', or 'auto' (follows prefers-color-scheme)
      renderer: 'auto', // 'svg', 'canvas', or 'auto'
      cssTokens: true // Enable CSS custom property theming (--nc-*)
    }
  };

  /**
   * Default configuration for Bar charts
   */
  const BAR_DEFAULTS = {
    ...DEFAULT_CONFIG,
    type: 'bar',
    style: {
      ...DEFAULT_CONFIG.style,
      bar: {
        borderRadius: 4,
        gap: 0.2, // Gap between bars as fraction of bar width
        groupGap: 0.5 // Gap between groups as fraction of bar width
      }
    },
    options: {
      ...DEFAULT_CONFIG.options,
      orientation: 'vertical', // 'vertical' or 'horizontal'
      stacked: false,
      axis: {
        x: { enabled: true, label: '' },
        y: { enabled: true, label: '' }
      }
    }
  };

  /**
   * Default configuration for Pie charts
   */
  const PIE_DEFAULTS = {
    ...DEFAULT_CONFIG,
    type: 'pie',
    style: {
      ...DEFAULT_CONFIG.style,
      pie: {
        startAngle: -Math.PI / 2,
        endAngle: Math.PI * 1.5,
        innerRadius: 0, // 0 for pie, > 0 for donut
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    },
    options: {
      ...DEFAULT_CONFIG.options,
      legend: {
        ...DEFAULT_CONFIG.options.legend,
        position: 'right'
      },
      labels: {
        enabled: true,
        position: 'outside', // 'inside', 'outside', 'none'
        format: 'percent' // 'percent', 'value', 'label', 'custom'
      }
    }
  };

  /**
   * Default configuration for Line charts
   */
  const LINE_DEFAULTS = {
    ...DEFAULT_CONFIG,
    type: 'line',
    style: {
      ...DEFAULT_CONFIG.style,
      line: {
        width: 2,
        tension: 0.4, // Bezier curve tension (only used when smooth: 'bezier')
        pointRadius: 4,
        pointBorderWidth: 2,
        pointBorderColor: '#ffffff'
      }
    },
    options: {
      ...DEFAULT_CONFIG.options,
      smooth: 'monotone', // 'monotone' (no overshoot), 'bezier', true (alias for bezier), or false
      fill: false, // Fill area under line
      showPoints: true,
      axis: {
        x: { enabled: true, label: '' },
        y: { enabled: true, label: '' }
      }
    }
  };

  /**
   * Default configuration for Area charts
   */
  const AREA_DEFAULTS = {
    ...DEFAULT_CONFIG,
    type: 'area',
    style: {
      ...DEFAULT_CONFIG.style,
      line: {
        width: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBorderWidth: 2,
        pointBorderColor: '#ffffff'
      },
      area: {
        fillOpacity: 0.25
      }
    },
    options: {
      ...DEFAULT_CONFIG.options,
      smooth: 'monotone',
      showPoints: true,
      stacked: false,
      axis: {
        x: { enabled: true, label: '' },
        y: { enabled: true, label: '' }
      }
    }
  };

  /**
   * Default configuration for Gauge charts
   */
  const GAUGE_DEFAULTS = {
    ...DEFAULT_CONFIG,
    type: 'gauge',
    style: {
      ...DEFAULT_CONFIG.style,
      animation: {
        duration: 800,
        easing: 'easeOutCubic'
      },
      gauge: {
        arcWidth: null, // auto-calculated from radius
        trackColor: '#f1f3f5',
        needle: true,
        roundedEnds: false, // pill-shaped arc endcaps
        valueFontSize: 28,
        tickFontSize: 10,
        zones: [
          { from: 0, to: 0.6, color: '#e03131' },
          { from: 0.6, to: 0.85, color: '#f08c00' },
          { from: 0.85, to: 1.0, color: '#0ca678' }
        ]
      }
    },
    options: {
      ...DEFAULT_CONFIG.options,
      legend: { enabled: false },
      variant: 'arc', // 'arc', 'ring', 'linear', 'compact'
      min: 0,
      max: 100,
      target: null,
      ticks: 5,
      showMax: true,
      valueSuffix: '',
      valuePrefix: '',
      valueDecimals: 0,
      labelPosition: 'below' // 'below' or 'inside' (compact: center text inside arc)
    }
  };

  /**
   * Default configuration for Sparkline charts
   */
  const SPARKLINE_DEFAULTS = {
    ...DEFAULT_CONFIG,
    type: 'sparkline',
    style: {
      ...DEFAULT_CONFIG.style,
      background: 'transparent',
      animation: {
        duration: 400,
        easing: 'easeOutCubic'
      },
      sparkline: {
        color: '#4c6ef5',
        lineWidth: 1.5,
        tension: 0.3,
        dotRadius: 2.5,
        barGap: 1,
        barRadius: 1,
        negativeColor: '#e03131',
        referenceColor: '#b3bac5',
        paddingX: 2,
        paddingY: 4
      }
    },
    options: {
      ...DEFAULT_CONFIG.options,
      responsive: true,
      legend: { enabled: false },
      tooltip: { enabled: false },
      variant: 'line', // 'line', 'area', 'bar'
      smooth: 'monotone',
      highlightLast: true,
      referenceLine: null
    }
  };

  /**
   * Default configuration for Combo charts (bar + line on shared axes)
   */
  const COMBO_DEFAULTS = {
    ...DEFAULT_CONFIG,
    type: 'combo',
    style: {
      ...DEFAULT_CONFIG.style,
      bar: {
        borderRadius: 4,
        gap: 0.2
      },
      combo: {
        barGap: 0.2,
        barBorderRadius: 4,
        lineWidth: 2,
        pointRadius: 4,
        tension: 0.4
      }
    },
    options: {
      ...DEFAULT_CONFIG.options,
      smooth: 'monotone',
      showPoints: true,
      axis: {
        x: { enabled: true, label: '' },
        y: { enabled: true, label: '' }
      }
    }
  };

  /**
   * Default configuration for Scatter / Bubble charts
   */
  const SCATTER_DEFAULTS = {
    ...DEFAULT_CONFIG,
    type: 'scatter',
    style: {
      ...DEFAULT_CONFIG.style,
      scatter: {
        pointRadius: 5,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointOpacity: 0.85,
        minRadius: 4,
        maxRadius: 30,
        bubbleOpacity: 0.6
      }
    },
    options: {
      ...DEFAULT_CONFIG.options,
      axis: {
        x: { enabled: true, label: '' },
        y: { enabled: true, label: '' }
      },
      sizeLabel: 'Size'
    }
  };

  /**
   * Dark theme style overrides
   * Applied when options.theme is 'dark' or 'auto' (with prefers-color-scheme: dark)
   */
  const DARK_STYLE = {
    background: '#1a1d23',
    fontColor: '#e0e2e7',
    grid: {
      color: '#2d3139'
    },
    axis: {
      color: '#e0e2e7'
    },
    tooltip: {
      background: '#2d3139',
      color: '#e8eaed',
      border: '1px solid #3d4350',
      shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
    },
    legend: {
      color: '#e0e2e7'
    },
    line: {
      pointBorderColor: '#1a1d23'
    },
    pie: {
      borderColor: '#1a1d23'
    },
    scatter: {
      pointBorderColor: '#1a1d23'
    },
    gauge: {
      trackColor: '#2d3139'
    }
  };

  /**
   * Dark palette — slightly brighter/saturated for dark backgrounds
   */
  const DARK_PALETTE = [
    '#5c7cfa', // Primary blue (brighter)
    '#20c997', // Success green (brighter)
    '#fcc419', // Warning yellow (brighter)
    '#ff6b6b', // Danger red (brighter)
    '#9775fa', // Purple (brighter)
    '#22b8cf', // Teal (brighter)
    '#f06595', // Pink (brighter)
    '#748ffc', // Light blue (brighter)
    '#38d9a9', // Mint (brighter)
    '#ffe066'  // Yellow (brighter)
  ];

  /**
   * Dark theme colors for KPI cards
   */
  const DARK_KPI_COLORS = {
    up: '#20c997',
    upBg: 'rgba(32, 201, 151, 0.15)',
    down: '#ff6b6b',
    downBg: 'rgba(255, 107, 107, 0.15)',
    good: '#20c997',
    warning: '#fcc419',
    danger: '#ff6b6b',
    label: '#8993a4',
    value: '#e0e2e7',
    previous: '#6b7280',
    border: '#2d3139',
    borderActive: '#5c7cfa',
    surface: '#1a1d23',
    progressTrack: '#2d3139'
  };

  /**
   * Detect whether dark mode should be active
   * @param {string} theme - 'light', 'dark', or 'auto'
   * @returns {boolean} True if dark mode should be used
   */
  function isDarkMode(theme) {
    if (theme === 'dark') return true;
    if (theme === 'light' || !theme) return false;
    // 'auto': check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  /**
   * Get the dark palette
   * @returns {string[]} Dark-mode optimized palette
   */
  function getDarkPalette() {
    return DARK_PALETTE;
  }

  /**
   * Default configuration for NetworkBall charts
   */
  const NETWORKBALL_DEFAULTS = {
    ...DEFAULT_CONFIG,
    type: 'networkball',
    data: {
      nodeCount: 40,
      datasets: []
    },
    style: {
      ...DEFAULT_CONFIG.style,
      background: '#ffffff',
      animation: { duration: 0 },
      networkball: {
        nodeCount: 40,
        nodeRadius: 3.5,
        nodeColor: '#8b97b5',
        nodeOpacity: 0.5,
        connectionOpacity: 0.1,
        connectionWidth: 0.8,
        connectionDistance: 0.8,
        activeColor: '#4ade80',
        glowRadius: 14,
        sphereScale: 0.75,
        rotationSpeed: 0.3,
        energyDecay: 1.5,
        labelFontSize: 10,
        travelerSpeed: 1.2,
        travelerMaxHops: 5
      }
    },
    options: {
      ...DEFAULT_CONFIG.options,
      responsive: true,
      legend: { enabled: false },
      tooltip: { enabled: false },
      renderer: 'canvas',
      cssTokens: false
    }
  };

  /**
   * Color palette
   */
  const COLOR_PALETTE = PALETTE;

  /**
   * CSS Custom Property (token) resolution for chart styling
   *
   * Allows charts to be themed via CSS custom properties on the container element.
   * Token names follow the pattern: --nc-{category}-{property}
   *
   * Priority: CSS tokens > JS config > defaults
   *
   * @example
   * .my-chart {
   *   --nc-background: #1a1a2e;
   *   --nc-font-color: #e0e0e0;
   *   --nc-grid-color: #333;
   *   --nc-palette-1: #e94560;
   *   --nc-palette-2: #0f3460;
   * }
   */

  /**
   * Map of CSS custom property names to config paths and value types.
   * Type 'number' will parseFloat the CSS value, 'string' keeps it as-is.
   */
  const TOKEN_MAP = [
    // Theme
    { token: '--nc-theme', path: 'options.theme', type: 'string' },

    // Global
    { token: '--nc-background', path: 'style.background', type: 'string' },
    { token: '--nc-font-family', path: 'style.fontFamily', type: 'string' },
    { token: '--nc-font-size', path: 'style.fontSize', type: 'number' },
    { token: '--nc-font-color', path: 'style.fontColor', type: 'string' },

    // Grid
    { token: '--nc-grid-color', path: 'style.grid.color', type: 'string' },
    { token: '--nc-grid-width', path: 'style.grid.width', type: 'number' },

    // Axis
    { token: '--nc-axis-color', path: 'style.axis.color', type: 'string' },
    { token: '--nc-axis-width', path: 'style.axis.width', type: 'number' },
    { token: '--nc-axis-font-size', path: 'style.axis.fontSize', type: 'number' },

    // Animation
    { token: '--nc-animation-duration', path: 'style.animation.duration', type: 'number' },

    // Tooltip
    { token: '--nc-tooltip-background', path: 'style.tooltip.background', type: 'string' },
    { token: '--nc-tooltip-color', path: 'style.tooltip.color', type: 'string' },
    { token: '--nc-tooltip-font-size', path: 'style.tooltip.fontSize', type: 'number' },
    { token: '--nc-tooltip-padding', path: 'style.tooltip.padding', type: 'number' },
    { token: '--nc-tooltip-border-radius', path: 'style.tooltip.borderRadius', type: 'number' },
    { token: '--nc-tooltip-shadow', path: 'style.tooltip.shadow', type: 'string' },

    // Legend
    { token: '--nc-legend-font-size', path: 'style.legend.fontSize', type: 'number' },
    { token: '--nc-legend-color', path: 'style.legend.color', type: 'string' },
    { token: '--nc-legend-marker-size', path: 'style.legend.marker.size', type: 'number' },

    // Bar
    { token: '--nc-bar-border-radius', path: 'style.bar.borderRadius', type: 'number' },
    { token: '--nc-bar-gap', path: 'style.bar.gap', type: 'number' },
    { token: '--nc-bar-group-gap', path: 'style.bar.groupGap', type: 'number' },

    // Line
    { token: '--nc-line-width', path: 'style.line.width', type: 'number' },
    { token: '--nc-line-tension', path: 'style.line.tension', type: 'number' },
    { token: '--nc-line-point-radius', path: 'style.line.pointRadius', type: 'number' },
    { token: '--nc-line-point-border-width', path: 'style.line.pointBorderWidth', type: 'number' },
    { token: '--nc-line-point-border-color', path: 'style.line.pointBorderColor', type: 'string' },

    // Pie
    { token: '--nc-pie-border-width', path: 'style.pie.borderWidth', type: 'number' },
    { token: '--nc-pie-border-color', path: 'style.pie.borderColor', type: 'string' },
    { token: '--nc-pie-inner-radius', path: 'style.pie.innerRadius', type: 'number' },

    // Gauge
    { token: '--nc-gauge-arc-width', path: 'style.gauge.arcWidth', type: 'number' },
    { token: '--nc-gauge-track-color', path: 'style.gauge.trackColor', type: 'string' },
    { token: '--nc-gauge-needle', path: 'style.gauge.needle', type: 'boolean' },
    { token: '--nc-gauge-rounded-ends', path: 'style.gauge.roundedEnds', type: 'boolean' },
    { token: '--nc-gauge-value-font-size', path: 'style.gauge.valueFontSize', type: 'number' },
    { token: '--nc-gauge-tick-font-size', path: 'style.gauge.tickFontSize', type: 'number' },
  ];

  /** Number of palette slots to check */
  const PALETTE_SIZE = 10;

  /**
   * Set a value on a nested object by dot-notation path
   * @param {Object} obj - Target object
   * @param {string} path - Dot-notation path (e.g. 'style.grid.color')
   * @param {*} value - Value to set
   */
  function setNested(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined || current[keys[i]] === null) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Parse a CSS token value to the expected type
   * @param {string} raw - Raw CSS value string
   * @param {string} type - Expected type ('string' or 'number')
   * @returns {string|number|null} Parsed value, or null if invalid
   */
  function parseTokenValue(raw, type) {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    if (type === 'number') {
      const num = parseFloat(trimmed);
      return isNaN(num) ? null : num;
    }

    if (type === 'boolean') {
      if (trimmed === '1' || trimmed === 'true') return true;
      if (trimmed === '0' || trimmed === 'false') return false;
      return null;
    }

    return trimmed;
  }

  /**
   * Read CSS custom properties from an element and return a partial config object
   * @param {Element} element - DOM element to read computed styles from
   * @returns {Object} Partial config with resolved token values
   */
  function resolveCSSTokens(element) {
    if (!element || typeof getComputedStyle !== 'function') {
      return {};
    }

    const computed = getComputedStyle(element);
    const config = {};

    // Resolve mapped tokens
    for (const { token, path, type } of TOKEN_MAP) {
      const raw = computed.getPropertyValue(token);
      const value = parseTokenValue(raw, type);

      if (value !== null) {
        setNested(config, path, value);
      }
    }

    // Resolve palette tokens (--nc-palette-1 through --nc-palette-10)
    const palette = [];
    let hasAnyPalette = false;

    for (let i = 1; i <= PALETTE_SIZE; i++) {
      const raw = computed.getPropertyValue(`--nc-palette-${i}`);
      const value = parseTokenValue(raw, 'string');

      if (value !== null) {
        hasAnyPalette = true;
        palette.push(value);
      }
    }

    if (hasAnyPalette) {
      config.palette = palette;
    }

    return config;
  }

  /**
   * Get the list of supported CSS token names (for documentation/debugging)
   * @returns {string[]} Array of supported token names
   */
  function getSupportedTokens() {
    const tokens = TOKEN_MAP.map(({ token }) => token);

    for (let i = 1; i <= PALETTE_SIZE; i++) {
      tokens.push(`--nc-palette-${i}`);
    }

    return tokens;
  }

  /**
   * Tooltip component for charts
   *
   * Supports two content formats:
   * 1. Simple object: { key: value } — rendered as key: value rows
   * 2. Rich format: { header, rows: [{ color, label, value }], footer } — renders
   *    structured rows with color swatches, like SAP Fiori / ERP dashboards
   */


  class Tooltip {
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

      const sep = this.options.separatorColor || '#333';

      // Header
      if (content.header) {
        const header = document.createElement('div');
        Object.assign(header.style, {
          fontWeight: '600',
          marginBottom: '4px',
          borderBottom: `1px solid ${sep}`,
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
          borderTop: `1px solid ${sep}`,
          marginTop: '4px',
          paddingTop: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px'
        });

        const label = document.createElement('span');
        label.style.color = this.options.footerLabelColor || '#8993a4';
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

  /**
   * Interactive legend component for charts
   */


  class Legend {
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
        color: options.dark ? '#e0e4ef' : '#172b4d',
        marker: { size: 10, height: 3 },
        interactive: true,
        dark: false,
        ...options
      };
      // Ensure color matches dark mode even if caller set dark but not color
      if (options.dark && !options.color) {
        this.options.color = '#e0e4ef';
      }

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
        // Dark/light color tokens
        const borderColor = vis ? (dk ? 'rgba(255,255,255,0.12)' : '#dfe1e6') : (dk ? 'rgba(255,255,255,0.06)' : '#ebecf0');
        const bgColor = vis ? (dk ? 'rgba(255,255,255,0.06)' : '#ffffff') : (dk ? 'rgba(255,255,255,0.03)' : '#f8f9fb');
        const textColor = vis ? this.options.color : (dk ? '#6b7394' : '#b3bac5');
        const mutedColor = dk ? '#6b7394' : '#8993a4';

        const itemEl = createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            fontSize: this.options.fontSize + 'px',
            fontFamily: 'inherit',
            border: `1px solid ${borderColor}`,
            borderRadius: '3px',
            cursor: 'pointer',
            background: bgColor,
            color: textColor,
            opacity: vis ? '1' : '0.5',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            userSelect: 'none'
          }
        });

        // Marker swatch
        const marker = createElement('span', {
          style: {
            width: (this.options.marker.size || 10) + 'px',
            height: (this.options.marker.height || 3) + 'px',
            borderRadius: '2px',
            backgroundColor: vis ? item.color : mutedColor,
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
              color: mutedColor,
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

  /**
   * DataTable component — auto-generated data table that syncs hover with charts.
   *
   * Integrated into Chart base class via options.table config:
   *   options: {
   *     table: {
   *       enabled: true,
   *       viewMode: 'split',    // 'chart' | 'table' | 'split'
   *       columns: [...],       // optional custom columns
   *       maxHeight: 200,       // max height in split mode (scrollable)
   *     }
   *   }
   */


  class DataTable {
    /**
     * @param {Element} container - Parent element to mount into
     * @param {Object} options - Table configuration
     */
    constructor(container, options = {}) {
      this.container = container;
      this.options = {
        enabled: true,
        viewMode: 'split',
        maxHeight: 200,
        columns: null,
        fontFamily: 'inherit',
        monoFamily: 'monospace',
        dark: false,
        ...options
      };

      this.element = null;
      this._onRowHover = null;
      this._onRowLeave = null;
      this._rows = [];
    }

    /**
     * Build table from chart data
     * @param {Object} chartData - { labels, datasets } from chart config
     * @param {Object} [extra] - Extra config { columns, formatValue, colors }
     */
    setData(chartData, extra = {}) {
      const { labels = [], datasets = [] } = chartData;
      const columns = extra.columns || this.options.columns || this._autoColumns(datasets);
      const colors = extra.colors || datasets.map((ds, i) => ds.color || null);

      this._rows = labels.map((label, i) => {
        const row = { _index: i, _label: label };
        datasets.forEach((ds, di) => {
          const key = ds.label || ds.key || `series_${di}`;
          row[key] = ds.values?.[i] ?? null;
          row[`_color_${di}`] = colors[di];
        });
        return row;
      });

      this._columns = columns;
      this._datasets = datasets;
      this._render();
    }

    /**
     * Generate columns automatically from datasets
     */
    _autoColumns(datasets) {
      const cols = [{ key: '_label', label: 'Period', align: 'left' }];
      datasets.forEach((ds) => {
        const key = ds.label || ds.key || 'Value';
        cols.push({
          key,
          label: ds.label || 'Value',
          align: 'right',
          mono: true
        });
      });
      return cols;
    }

    /**
     * Set hover callback (called when table row is hovered)
     * @param {Function} onHover - (index) => void
     * @param {Function} onLeave - () => void
     */
    onHover(onHover, onLeave) {
      this._onRowHover = onHover;
      this._onRowLeave = onLeave;
    }

    /**
     * Highlight a row by index (called from chart hover)
     * @param {number} index - Row index
     */
    highlightRow(index) {
      if (!this.element) return;
      const rows = this.element.querySelectorAll('tr[data-row]');
      rows.forEach(r => {
        r.classList.toggle('hovered', parseInt(r.dataset.row) === index);
      });
    }

    /**
     * Clear all row highlights
     */
    clearHighlight() {
      if (!this.element) return;
      const rows = this.element.querySelectorAll('tr[data-row]');
      rows.forEach(r => r.classList.remove('hovered'));
    }

    /**
     * Mount or update the table element
     */
    _render() {
      const isSplit = this.options.viewMode === 'split';

      const dk = this.options.dark;

      if (!this.element) {
        this.element = createElement('div', {
          class: 'newchart-datatable',
          style: {
            border: `1px solid ${dk ? '#2d3139' : '#ebecf0'}`,
            borderRadius: '4px',
            overflow: 'hidden',
            marginTop: isSplit ? '12px' : '0',
            maxHeight: isSplit ? this.options.maxHeight + 'px' : 'none',
            overflowY: isSplit ? 'auto' : 'visible'
          }
        });
        this.container.appendChild(this.element);
      }

      // Dark mode class for CSS hover styles
      if (dk) {
        this.element.classList.add('nc-dark');
      } else {
        this.element.classList.remove('nc-dark');
      }

      // Update split styling
      this.element.style.marginTop = isSplit ? '12px' : '0';
      this.element.style.maxHeight = isSplit ? this.options.maxHeight + 'px' : 'none';
      this.element.style.overflowY = isSplit ? 'auto' : 'visible';

      const table = document.createElement('table');
      Object.assign(table.style, {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px',
        fontFamily: this.options.fontFamily
      });

      // Head
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      this._columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        Object.assign(th.style, {
          textAlign: col.align || 'left',
          padding: '8px 10px',
          color: '#8993a4',
          fontWeight: '500',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          borderBottom: `2px solid ${dk ? '#3d4350' : '#dfe1e6'}`,
          background: dk ? '#1e2028' : '#f8f9fb',
          position: 'sticky',
          top: '0',
          whiteSpace: 'nowrap',
          zIndex: '1'
        });
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      // Body
      const tbody = document.createElement('tbody');
      this._rows.forEach((row, ri) => {
        const tr = document.createElement('tr');
        tr.dataset.row = ri;
        Object.assign(tr.style, {
          transition: 'background 0.08s',
          cursor: 'pointer',
          background: ri % 2 === 0 ? (dk ? '#1a1d23' : '#ffffff') : (dk ? '#1e2028' : '#f8f9fb'),
          borderBottom: `1px solid ${dk ? '#2d3139' : '#ebecf0'}`
        });

        this._columns.forEach((col, ci) => {
          const td = document.createElement('td');
          Object.assign(td.style, {
            padding: '7px 10px',
            textAlign: col.align || 'left',
            fontFamily: col.mono ? this.options.monoFamily : 'inherit',
            fontWeight: ci === 0 ? '500' : '400',
            color: ci === 0 ? (dk ? '#e0e2e7' : '#172b4d') : (dk ? '#a1a7b3' : '#5e6c84')
          });

          const value = row[col.key];
          if (col.render) {
            td.innerHTML = col.render(row, ri);
          } else if (value != null && typeof value === 'number') {
            td.textContent = value.toLocaleString('sv-SE');
          } else {
            td.textContent = value ?? '';
          }

          tr.appendChild(td);
        });

        // Hover events: table → chart
        tr.addEventListener('mouseenter', () => {
          this.highlightRow(ri);
          if (this._onRowHover) this._onRowHover(ri);
        });
        tr.addEventListener('mouseleave', () => {
          this.clearHighlight();
          if (this._onRowLeave) this._onRowLeave();
        });

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);

      // Add CSS for hover state (once per document)
      DataTable._ensureStyles();

      this.element.innerHTML = '';
      this.element.appendChild(table);
    }

    /**
     * Update view mode
     * @param {string} mode - 'chart' | 'table' | 'split'
     */
    setViewMode(mode) {
      this.options.viewMode = mode;

      if (!this.element) return;

      if (mode === 'chart') {
        this.element.style.display = 'none';
      } else {
        this.element.style.display = '';
        const isSplit = mode === 'split';
        this.element.style.marginTop = isSplit ? '12px' : '0';
        this.element.style.maxHeight = isSplit ? this.options.maxHeight + 'px' : 'none';
        this.element.style.overflowY = isSplit ? 'auto' : 'visible';
      }
    }

    /**
     * Show table
     */
    show() {
      if (this.element) this.element.style.display = '';
    }

    /**
     * Hide table
     */
    hide() {
      if (this.element) this.element.style.display = 'none';
    }

    /**
     * Inject shared CSS once per document
     */
    static _ensureStyles() {
      if (DataTable._stylesInjected) return;
      const style = document.createElement('style');
      style.id = 'newchart-datatable-styles';
      style.textContent = [
        '.newchart-datatable tr.hovered { background: #edf2ff !important; }',
        '.newchart-datatable.nc-dark tr.hovered { background: rgba(92,124,250,0.1) !important; }'
      ].join('\n');
      document.head.appendChild(style);
      DataTable._stylesInjected = true;
    }

    /**
     * Destroy table
     */
    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    }
  }

  /**
   * Animation engine using requestAnimationFrame
   */

  const EASING_FUNCTIONS = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => (--t) * t * t + 1,
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - (--t) * t * t * t,
    easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeInQuint: (t) => t * t * t * t * t,
    easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
    easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
  };

  /**
   * Animate a value from start to end
   * @param {Object} options - Animation options
   * @param {number} options.from - Start value
   * @param {number} options.to - End value
   * @param {number} options.duration - Duration in ms
   * @param {string} options.easing - Easing function name
   * @param {Function} options.onUpdate - Callback on each frame
   * @param {Function} options.onComplete - Callback on animation complete
   * @returns {Function} Cancel function
   */
  function animate(options) {
    const {
      from = 0,
      to = 1,
      duration = 300,
      easing = 'easeOutCubic',
      onUpdate = () => {},
      onComplete = () => {}
    } = options;

    const easingFunc = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS.easeOutCubic;
    let startTime = null;
    let frameId = null;
    let cancelled = false;

    const frame = (currentTime) => {
      if (cancelled) return;

      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFunc(progress);
      const value = from + (to - from) * easedProgress;

      onUpdate(value, progress);

      if (progress < 1) {
        frameId = requestAnimationFrame(frame);
      } else {
        onComplete();
      }
    };

    frameId = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }

  /**
   * Delay execution
   * @param {number} duration - Duration in ms
   * @param {Function} callback - Callback to execute
   * @returns {Function} Cancel function
   */
  function delay(duration, callback) {
    const timeoutId = setTimeout(callback, duration);
    return () => clearTimeout(timeoutId);
  }

  /**
   * Base Chart class - all chart types extend this
   */


  class Chart {
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

      // Apply dark theme: defaults < dark overrides < user config < CSS tokens
      this._dark = isDarkMode(this.config.options?.theme);
      if (this._dark) {
        // Build dark base, then re-apply user config on top
        const darkBase = deepMerge(DEFAULT_CONFIG, { style: DARK_STYLE });
        this.config = deepMerge(darkBase, config);
        // Set dark palette unless user provided their own
        if (!config.palette && !(this.config.options?.cssTokens !== false && resolveCSSTokens(this.element).palette)) {
          this.config.palette = getDarkPalette();
        }
        // Re-apply CSS tokens on top of dark config
        if (this.config.options?.cssTokens !== false) {
          const cssOverrides = resolveCSSTokens(this.element);
          this.config = deepMerge(this.config, cssOverrides);
        }
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

      // Listen for system theme changes when theme is 'auto'
      this._themeMediaQuery = null;
      this._themeChangeHandler = null;
      if (this.config.options?.theme === 'auto' && typeof window !== 'undefined' && window.matchMedia) {
        this._themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this._themeChangeHandler = () => {
          const wasDark = this._dark;
          this._dark = this._themeMediaQuery.matches;
          if (this._dark !== wasDark) {
            // Re-merge config with correct theme
            this._applyTheme(config);
            if (this.renderer) {
              this.renderer.destroy();
            }
            this.initRenderer();
            this.draw();
          }
        };
        this._themeMediaQuery.addEventListener('change', this._themeChangeHandler);
      }

      // Watch for class and style changes on <html> (dark toggle + palette tokens on :root)
      // and style changes on the chart element (per-element token overrides)
      // Re-reads CSS tokens and re-renders when detected
      this._htmlObserver = null;
      this._elementStyleObserver = null;
      this._userConfig = config;
      if (typeof MutationObserver !== 'undefined' && this.config.options?.cssTokens !== false) {
        const reapplyFromCSS = debounce(() => {
          const newTokens = resolveCSSTokens(this.element);
          const newTheme = newTokens.options?.theme;

          if (newTheme) {
            this._dark = isDarkMode(newTheme);
          } else if (typeof document !== 'undefined') {
            const htmlDark = document.documentElement.classList.contains('dark');
            this._dark = htmlDark;
          }

          this._applyTheme(this._userConfig);
          if (this.legend) { this.legend.destroy(); this.legend = null; }
          if (this.dataTable) { this.dataTable.destroy(); this.dataTable = null; }
          if (this.tooltip) { this.tooltip.destroy(); }
          this.tooltip = new Tooltip(this.container, this.config.style.tooltip);
          if (this.renderer) { this.renderer.destroy(); }
          this.initRenderer();
          this.draw();
        }, 100);

        // Watch both class (dark toggle) and style (palette tokens) on <html>
        this._htmlObserver = new MutationObserver(reapplyFromCSS);
        this._htmlObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'style']
        });

        // Also watch style on the chart element for per-element overrides
        this._elementStyleObserver = new MutationObserver(reapplyFromCSS);
        this._elementStyleObserver.observe(this.element, {
          attributes: true,
          attributeFilter: ['style']
        });
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
     * Apply theme to config (used for initial setup and auto theme changes)
     * @param {Object} userConfig - Original user-supplied config
     */
    _applyTheme(userConfig) {
      if (this._dark) {
        const darkBase = deepMerge(DEFAULT_CONFIG, { style: DARK_STYLE });
        this.config = deepMerge(darkBase, userConfig);
        if (!userConfig.palette) {
          this.config.palette = getDarkPalette();
        }
      } else {
        this.config = deepMerge(DEFAULT_CONFIG, userConfig);
      }
      if (this.config.options?.cssTokens !== false) {
        const cssOverrides = resolveCSSTokens(this.element);
        this.config = deepMerge(this.config, cssOverrides);
      }
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
        dark: this._dark,
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
          monoFamily: this.config.style.monoFamily,
          dark: this._dark
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

      if (this._themeMediaQuery && this._themeChangeHandler) {
        this._themeMediaQuery.removeEventListener('change', this._themeChangeHandler);
      }

      if (this._htmlObserver) {
        this._htmlObserver.disconnect();
      }

      if (this._elementStyleObserver) {
        this._elementStyleObserver.disconnect();
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
            ctx.fillStyle = this.config.style.background || '#ffffff';
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

  /**
   * Bar Chart implementation
   */


  class BarChart extends Chart {
    constructor(element, config = {}) {
      const mergedConfig = deepMerge(BAR_DEFAULTS, config);
      super(element, mergedConfig);
    }

    /**
     * Calculate bar dimensions
     */
    calculateBars() {
      const layout = this.calculateLayout();
      const { data, options } = this.config;

      // Filter datasets by legend visibility
      const visibleDatasets = data.datasets.filter((ds, i) => this.isDatasetVisible(ds, i));
      const numBars = data.labels?.length || 0;
      const numDatasets = visibleDatasets.length;

      if (numBars === 0) return [];

      const barWidth = layout.chartWidth / numBars;
      const barGap = barWidth * (this.config.style.bar?.gap || 0.2);
      const availableWidth = barWidth - barGap;

      const isStacked = !!options.stacked;
      const isPercent = options.stacked === 'percent';

      let datasetWidth;
      if (isStacked) {
        datasetWidth = availableWidth;
      } else {
        datasetWidth = availableWidth / Math.max(numDatasets, 1);
      }

      // Compute column totals for percent mode
      let columnTotals = null;
      if (isPercent) {
        columnTotals = new Array(numBars).fill(0);
        visibleDatasets.forEach(ds => {
          if (ds.values) {
            ds.values.forEach((v, i) => { columnTotals[i] += Math.abs(v); });
          }
        });
      }

      // Find min/max values across visible datasets
      let allValues = [];
      if (isPercent) {
        allValues = [0, 100];
      } else {
        visibleDatasets.forEach(ds => {
          if (ds.values) {
            allValues = allValues.concat(ds.values);
          }
        });

        // Include reference line values in scale
        const refLines = options.referenceLines || [];
        refLines.forEach(ref => {
          if (typeof ref.value === 'number') {
            allValues.push(ref.value);
          }
        });
      }

      if (allValues.length === 0) allValues = [0];

      const { min: minValue, max: maxValue } = getMinMax(allValues);
      const valueRange = maxValue - minValue || 1;
      const scale = isPercent
        ? [0, 25, 50, 75, 100]
        : generateScale(minValue, maxValue, 5);

      return {
        barWidth,
        availableWidth,
        datasetWidth,
        numBars,
        numDatasets,
        visibleDatasets,
        minValue,
        maxValue,
        valueRange,
        scale,
        layout,
        isStacked,
        isPercent,
        columnTotals
      };
    }

    /**
     * Render bar chart
     */
    render() {
      const { style, data, options } = this.config;
      const bars = this.calculateBars();

      if (bars.length === 0) return;

      const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = bars.layout;
      const { barWidth, availableWidth, datasetWidth, numBars, numDatasets, visibleDatasets, minValue, maxValue, valueRange, scale, isStacked, isPercent, columnTotals } = bars;

      // Draw grid
      if (style.grid?.color) {
        scale.forEach((value, index) => {
          const y = chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
          this.renderer.line(chartX, y, chartX + chartWidth, y, {
            stroke: style.grid.color,
            strokeWidth: style.grid.width || 1,
            opacity: 0.5
          });

          if (hasYAxis) {
            const label = isPercent ? `${formatNumber(value, 0)}%` : formatNumber(value, 0);
            this.renderer.text(label, chartX - 10, y, {
              fill: style.axis.color,
              fontSize: style.axis.fontSize,
              fontFamily: style.fontFamily,
              textAnchor: 'end',
              dominantBaseline: 'middle'
            });
          }
        });
      }

      // Draw axes
      if (hasYAxis) {
        this.renderer.line(chartX, chartY, chartX, chartY + chartHeight, {
          stroke: style.axis.color,
          strokeWidth: style.axis.width
        });
      }

      if (hasXAxis) {
        this.renderer.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight, {
          stroke: style.axis.color,
          strokeWidth: style.axis.width
        });
      }

      // Draw reference lines
      const refLines = options.referenceLines || [];
      refLines.forEach(ref => {
        let refValue = ref.value;

        // Handle computed reference values
        if (ref.value === 'average' || ref.value === 'mean') {
          const firstDs = visibleDatasets[0];
          if (firstDs?.values) {
            refValue = Math.round(firstDs.values.reduce((s, v) => s + v, 0) / firstDs.values.length);
          }
        }

        if (typeof refValue !== 'number') return;

        const ry = chartY + chartHeight - ((refValue - minValue) / valueRange) * chartHeight;

        this.renderer.line(chartX, ry, chartX + chartWidth, ry, {
          stroke: ref.color || '#868e96',
          strokeWidth: ref.strokeWidth || 1.5,
          strokeDasharray: ref.dash || '6 4',
          strokeLinecap: 'round'
        });

        // Label — always position inside chart area to avoid clipping
        if (ref.label) {
          const labelX = ref.labelPosition === 'right'
            ? chartX + chartWidth - 6
            : chartX + 4;
          const labelAnchor = ref.labelPosition === 'right' ? 'end' : 'start';
          const labelY = ry - 6;

          // Background pill for label
          if (ref.labelBackground) {
            const pillWidth = ref.label.length * 6 + 12;
            const pillX = ref.labelPosition === 'right'
              ? chartX + chartWidth - pillWidth - 2
              : labelX - 2;
            this.renderer.rect(pillX, labelY - 8, pillWidth, 16, {
              fill: ref.labelBackground,
              borderRadius: 3
            });
          }

          this.renderer.text(ref.label, labelX, labelY, {
            fill: ref.color || '#868e96',
            fontSize: 9,
            fontFamily: style.monoFamily || style.fontFamily,
            textAnchor: labelAnchor,
            dominantBaseline: 'auto',
            fontWeight: ref.labelBackground ? 600 : 400
          });
        }
      });

      // Draw bars
      const bars_ = [];
      const barGroupData = []; // data for hitboxes (created later)

      data.labels.forEach((label, labelIndex) => {
        const baseX = chartX + labelIndex * barWidth + barWidth / 2;
        const groupX = chartX + labelIndex * barWidth;

        // Column highlight background (hidden by default)
        const highlight = this.renderer.rect(groupX + 1, chartY, barWidth - 2, chartHeight, {
          fill: this.getPaletteColor(0),
          opacity: 0,
          borderRadius: 2
        });

        const groupBars = [];

        visibleDatasets.forEach((dataset, visibleIndex) => {
          const rawValue = dataset.values?.[labelIndex] || 0;

          // For percent mode, normalize to percentage of column total
          let displayValue;
          if (isPercent && columnTotals && columnTotals[labelIndex] > 0) {
            displayValue = (Math.abs(rawValue) / columnTotals[labelIndex]) * 100;
          } else {
            displayValue = rawValue;
          }

          const normalizedValue = (displayValue - minValue) / valueRange;
          const barHeight = normalizedValue * chartHeight;

          let x, y;

          if (isStacked) {
            let stackedHeight = 0;
            for (let i = 0; i < visibleIndex; i++) {
              const prevRaw = visibleDatasets[i].values?.[labelIndex] || 0;
              let prevDisplay;
              if (isPercent && columnTotals && columnTotals[labelIndex] > 0) {
                prevDisplay = (Math.abs(prevRaw) / columnTotals[labelIndex]) * 100;
              } else {
                prevDisplay = prevRaw;
              }
              const prevNormalized = (prevDisplay - minValue) / valueRange;
              stackedHeight += prevNormalized * chartHeight;
            }
            y = chartY + chartHeight - stackedHeight - barHeight;
            x = baseX - availableWidth / 2;
          } else {
            x = baseX - availableWidth / 2 + visibleIndex * datasetWidth;
            y = chartY + chartHeight - barHeight;
          }

          const color = dataset.color || this.getPaletteColor(visibleIndex);

          // Only round top corners — bottom sits flat on the axis
          const isTopOfStack = isStacked
            ? visibleIndex === visibleDatasets.length - 1
            : true;

          const barElement = this.renderer.rect(
            x, y,
            isStacked ? availableWidth : datasetWidth,
            barHeight,
            {
              fill: color,
              borderRadius: style.bar?.borderRadius || 0,
              borderRadiusTop: isTopOfStack,
              opacity: 1
            }
          );

          if (barElement) {
            barElement.style.cursor = 'pointer';
            barElement.style.transition = 'opacity 0.12s, filter 0.12s';
          }

          const barInfo = {
            element: barElement,
            value: rawValue,
            displayValue,
            label: label,
            datasetLabel: dataset.label,
            color,
            x,
            y,
            width: isStacked ? availableWidth : datasetWidth,
            height: barHeight,
            labelIndex,
            datasetIndex: visibleIndex
          };

          bars_.push(barInfo);
          groupBars.push(barInfo);
        });

        // Per-bar reference markers — span only the actual bars, not the whole column
        const barMarkers = options.barMarkers || [];
        barMarkers.forEach(marker => {
          const markerValue = marker.values?.[labelIndex];
          if (markerValue == null) return;

          const markerY = chartY + chartHeight - ((markerValue - minValue) / valueRange) * chartHeight;
          const markerX1 = baseX - availableWidth / 2;
          const markerX2 = baseX + availableWidth / 2;
          this.renderer.line(markerX1, markerY, markerX2, markerY, {
            stroke: marker.color || '#f08c00',
            strokeWidth: marker.strokeWidth || 2,
            strokeLinecap: 'round'
          });
        });

        barGroupData.push({ groupX, highlight, bars: groupBars, label, labelIndex });

        // X axis labels
        if (hasXAxis) {
          this.renderer.text(label, baseX, chartY + chartHeight + 15, {
            fill: style.axis.color,
            fontSize: style.axis.fontSize,
            fontFamily: style.fontFamily,
            textAnchor: 'middle',
            dominantBaseline: 'top'
          });
        }
      });

      // Create invisible hitboxes AFTER all visible elements so they sit on top in SVG
      barGroupData.forEach(group => {
        const hitbox = this.renderer.rect(group.groupX, chartY, barWidth, chartHeight, {
          fill: 'transparent',
          opacity: 0
        });

        if (hitbox) {
          hitbox.style.cursor = 'pointer';

          this.addElementListener(hitbox, 'mouseenter', (e) => {
            // Show column highlight
            group.highlight.setAttribute('opacity', '0.03');

            // Brighten hovered bars, dim all others
            bars_.forEach(bar => {
              if (!bar.element) return;
              if (bar.labelIndex === group.labelIndex) {
                bar.element.setAttribute('opacity', '1');
                bar.element.style.filter = 'brightness(1.08)';
              } else {
                bar.element.setAttribute('opacity', '0.3');
                bar.element.style.filter = '';
              }
            });

            // Build rich tooltip content — bars + markers + reference lines
            const rows = [];
            let currentValue = null;
            let prevValue = null;

            group.bars.forEach(bar => {
              // Detect if this dataset is a dashed/ref series
              const dataset = visibleDatasets[bar.datasetIndex];
              const isDashed = dataset?.dash || dataset?.ref || false;

              rows.push({
                color: bar.color,
                label: bar.datasetLabel || 'Value',
                value: isPercent
                  ? `${formatNumber(bar.value, 0)} (${formatNumber(bar.displayValue, 1)}%)`
                  : formatNumber(bar.value, 0),
                style: isDashed ? 'dashed' : 'solid'
              });

              // Track first two datasets for YoY calculation
              if (bar.datasetIndex === 0) currentValue = bar.value;
              if (bar.datasetIndex === 1) prevValue = bar.value;
            });

            // Add per-bar marker values (e.g. budget per bar)
            const barMarkers = options.barMarkers || [];
            barMarkers.forEach(marker => {
              const markerValue = marker.values?.[group.labelIndex];
              if (markerValue == null) return;
              rows.push({
                color: marker.color || '#f08c00',
                label: marker.label || 'Target',
                value: formatNumber(markerValue, 0),
                style: 'dashed'
              });
            });

            // Add reference line values (snitt, budget average, etc.)
            refLines.forEach(ref => {
              let refValue = ref.value;
              if (ref.value === 'average' || ref.value === 'mean') {
                const firstDs = visibleDatasets[0];
                if (firstDs?.values) {
                  refValue = Math.round(firstDs.values.reduce((s, v) => s + v, 0) / firstDs.values.length);
                }
              }
              if (typeof refValue !== 'number') return;
              rows.push({
                color: ref.color || '#868e96',
                label: ref.label || 'Ref',
                value: formatNumber(refValue, 0),
                style: 'dashed'
              });
            });

            // Compute change footer if we have two comparable datasets
            let footer = null;
            if (currentValue != null && prevValue != null && prevValue !== 0) {
              const change = ((currentValue - prevValue) / prevValue) * 100;
              const isPositive = change >= 0;
              // Use configured label, or derive from dataset labels
              const footerLabel = options.tooltipChangeLabel
                || `${group.bars[0]?.datasetLabel || ''} vs ${group.bars[1]?.datasetLabel || ''}:`;
              footer = {
                label: footerLabel,
                value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
                color: isPositive ? (this._dark ? '#69db7c' : '#0ca678') : (this._dark ? '#ff8787' : '#e03131')
              };
            }

            this.showTooltip(e, {
              header: group.label,
              rows,
              footer
            });

            // Fire onHover callback
            if (typeof options.onHover === 'function') {
              options.onHover(group.labelIndex, group.label);
            }
          });

          this.addElementListener(hitbox, 'mouseleave', () => {
            this._clearColumnHighlight();

            // Fire onHoverEnd callback
            if (typeof options.onHoverEnd === 'function') {
              options.onHoverEnd();
            }
          });
        }
      });

      // Store group data for programmatic highlight
      this._barGroups = barGroupData;
      this.bars = bars_;
    }

    /**
     * Programmatically highlight a column by label index
     * @param {number} index - Label index to highlight
     */
    highlightColumn(index) {
      if (!this._barGroups || !this.bars) return;
      const group = this._barGroups[index];
      if (!group) return;

      group.highlight.setAttribute('opacity', '0.03');

      this.bars.forEach(bar => {
        if (!bar.element) return;
        if (bar.labelIndex === index) {
          bar.element.setAttribute('opacity', '1');
          bar.element.style.filter = 'brightness(1.08)';
        } else {
          bar.element.setAttribute('opacity', '0.3');
          bar.element.style.filter = '';
        }
      });
    }

    /**
     * Clear all column highlights
     */
    clearHighlight() {
      this._clearColumnHighlight();
    }

    /**
     * Internal: reset all bars and highlights to default state
     */
    _clearColumnHighlight() {
      if (this._barGroups) {
        this._barGroups.forEach(g => {
          g.highlight.setAttribute('opacity', '0');
        });
      }
      if (this.bars) {
        this.bars.forEach(bar => {
          if (!bar.element) return;
          bar.element.setAttribute('opacity', '1');
          bar.element.style.filter = '';
        });
      }
    }

    /**
     * Animate bars
     */
    animate() {
      const duration = this.config.style.animation?.duration || 600;
      const easing = this.config.style.animation?.easing || 'easeOutCubic';

      if (!this.bars || !this.bars.length) return;

      this.bars.forEach((bar, index) => {
        const staggerDelay = (index / this.bars.length) * (duration * 0.3);

        const cancelDelay = delay(staggerDelay, () => {
          this.animateValue({
            from: 0,
            to: 1,
            duration: duration,
            easing: easing,
            onUpdate: (progress) => {
              const currentHeight = bar.height * progress;
              const y = bar.y + bar.height - currentHeight;

              if (bar.element) {
                bar.element.setAttribute('height', currentHeight);
                bar.element.setAttribute('y', y);
              }
            }
          });
        });
        this.animationCancels.push(cancelDelay);
      });
    }
  }

  /**
   * Pie Chart implementation
   */


  class PieChart extends Chart {
    constructor(element, config = {}) {
      const mergedConfig = deepMerge(PIE_DEFAULTS, config);
      super(element, mergedConfig);
    }

    /**
     * Calculate pie slices
     */
    calculateSlices() {
      const { data, options, style } = this.config;
      const dataset = data.datasets[0];

      if (!dataset || !dataset.values) {
        return [];
      }

      const values = dataset.values;
      const total = values.reduce((sum, v) => sum + Math.abs(v), 0);

      if (total === 0) return [];

      const slices = [];
      const padding = options.padding || 20;
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const maxRadius = Math.min(this.width, this.height) / 2 - padding - 40;
      const radius = maxRadius;
      const innerRadius = style.pie?.innerRadius || 0;

      const startAngle = style.pie?.startAngle || -Math.PI / 2;
      const endAngle = style.pie?.endAngle || Math.PI * 1.5;
      const availableAngle = endAngle - startAngle;

      let currentAngle = startAngle;

      values.forEach((value, index) => {
        const sliceAngle = (Math.abs(value) / total) * availableAngle;
        const midAngle = currentAngle + sliceAngle / 2;

        const color = dataset.colors?.[index] || this.getPaletteColor(index);

        slices.push({
          index,
          value: Math.abs(value),
          percent: (Math.abs(value) / total) * 100,
          startAngle: currentAngle,
          endAngle: currentAngle + sliceAngle,
          midAngle,
          color,
          label: data.labels?.[index] || `Slice ${index + 1}`,
          centerX,
          centerY,
          radius,
          innerRadius
        });

        currentAngle += sliceAngle;
      });

      return slices;
    }

    /**
     * Render pie chart
     */
    render() {
      const { style, options } = this.config;
      const slices = this.calculateSlices();

      if (slices.length === 0) return;

      const borderWidth = style.pie?.borderWidth || 2;
      const borderColor = style.pie?.borderColor || '#ffffff';
      const labelPosition = options.labels?.position || 'outside';
      const innerRadius = slices[0]?.innerRadius || 0;
      const isDonut = innerRadius > 0;
      const total = slices.reduce((sum, s) => sum + s.value, 0);
      const cx = slices[0].centerX;
      const cy = slices[0].centerY;

      // Store slice elements for hover interaction
      this._sliceElements = [];

      // Draw slices
      slices.forEach((slice) => {
        const sliceElement = this.renderer.arc(
          slice.centerX,
          slice.centerY,
          slice.radius,
          slice.startAngle,
          slice.endAngle,
          slice.innerRadius,
          {
            fill: slice.color,
            stroke: borderColor,
            strokeWidth: borderWidth,
            opacity: 1
          }
        );

        this._sliceElements.push({ element: sliceElement, slice });

        // Hover effects: explode + dim others
        if (sliceElement) {
          sliceElement.style.cursor = 'pointer';
          sliceElement.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out, filter 0.15s ease-out';
          sliceElement.style.transformOrigin = `${cx}px ${cy}px`;

          this.addElementListener(sliceElement, 'mouseenter', (e) => {
            // Explode hovered slice outward
            const tx = Math.cos(slice.midAngle) * 5;
            const ty = Math.sin(slice.midAngle) * 5;
            sliceElement.style.transform = `translate(${tx}px, ${ty}px)`;
            sliceElement.style.filter = 'brightness(1.08)';
            sliceElement.setAttribute('opacity', '1');

            // Dim other slices
            this._sliceElements.forEach(({ element: el }) => {
              if (el !== sliceElement) {
                el.setAttribute('opacity', '0.35');
              }
            });

            // Update center text if donut
            if (isDonut && this._centerTextValue && this._centerTextLabel) {
              this._centerTextValue.textContent = formatNumber(slice.percent, 1) + '%';
              this._centerTextLabel.textContent = slice.label;
            }

            this.showTooltip(e, {
              [slice.label]: formatNumber(slice.value, 0),
              'Share': formatNumber(slice.percent, 1) + '%'
            });

            if (typeof options.onHover === 'function') {
              options.onHover(slice.index, slice.label);
            }
          });

          this.addElementListener(sliceElement, 'mouseleave', () => {
            this._clearSliceHighlight();

            if (typeof options.onHoverEnd === 'function') {
              options.onHoverEnd();
            }
          });

          // Click callback
          this.addElementListener(sliceElement, 'click', (e) => {
            if (typeof options.onClick === 'function') {
              options.onClick({
                index: slice.index,
                label: slice.label,
                value: slice.value,
                percent: slice.percent,
                event: e
              });
            }
          });
        }

        // Draw labels
        if (labelPosition !== 'none') {
          const labelDistance = labelPosition === 'inside'
            ? (slice.radius + slice.innerRadius) / 2
            : slice.radius + 20;

          const labelX = slice.centerX + labelDistance * Math.cos(slice.midAngle);
          const labelY = slice.centerY + labelDistance * Math.sin(slice.midAngle);

          const labelFormat = options.labels?.format || 'percent';
          let labelText;

          switch (labelFormat) {
            case 'value':
              labelText = formatNumber(slice.value, 0);
              break;
            case 'label':
              labelText = slice.label;
              break;
            case 'percent':
            default:
              labelText = formatNumber(slice.percent, 1) + '%';
          }

          this.renderer.text(labelText, labelX, labelY, {
            fill: style.fontColor,
            fontSize: style.fontSize,
            fontFamily: style.fontFamily,
            textAnchor: 'middle',
            dominantBaseline: 'middle'
          });
        }
      });

      // White center circle + center text for donut charts
      if (isDonut) {
        this.renderer.circle(cx, cy, innerRadius - 2, {
          fill: style.background || '#ffffff'
        });

        this._centerTextValue = this.renderer.text(formatNumber(total, 0), cx, cy - 3, {
          fill: style.fontColor || '#172b4d',
          fontSize: 16,
          fontFamily: style.monoFamily || style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle',
          fontWeight: 700
        });

        this._centerTextLabel = this.renderer.text('total', cx, cy + 14, {
          fill: style.axis?.color || '#8993a4',
          fontSize: 9,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        });
      }

      this.slices = slices;
    }

    /**
     * Programmatically highlight a slice by index
     * @param {number} index - Slice index to highlight
     */
    highlightSlice(index) {
      if (!this._sliceElements || !this.slices) return;
      const target = this._sliceElements[index];
      if (!target) return;

      const { style, options } = this.config;
      const innerRadius = this.slices[0]?.innerRadius || 0;
      const isDonut = innerRadius > 0;
      this.slices.reduce((sum, s) => sum + s.value, 0);
      const slice = target.slice;

      // Explode target
      const tx = Math.cos(slice.midAngle) * 5;
      const ty = Math.sin(slice.midAngle) * 5;
      target.element.style.transform = `translate(${tx}px, ${ty}px)`;
      target.element.style.filter = 'brightness(1.08)';
      target.element.setAttribute('opacity', '1');

      // Dim others
      this._sliceElements.forEach(({ element: el }, i) => {
        if (i !== index) {
          el.setAttribute('opacity', '0.35');
        }
      });

      // Update center text
      if (isDonut && this._centerTextValue && this._centerTextLabel) {
        this._centerTextValue.textContent = formatNumber(slice.percent, 1) + '%';
        this._centerTextLabel.textContent = slice.label;
      }
    }

    /**
     * Clear all slice highlights
     */
    clearHighlight() {
      this._clearSliceHighlight();
    }

    /**
     * Internal: reset all slices to default state
     */
    _clearSliceHighlight() {
      const innerRadius = this.slices?.[0]?.innerRadius || 0;
      const isDonut = innerRadius > 0;
      const total = this.slices ? this.slices.reduce((sum, s) => sum + s.value, 0) : 0;

      if (this._sliceElements) {
        this._sliceElements.forEach(({ element: el }) => {
          el.style.transform = '';
          el.style.filter = '';
          el.setAttribute('opacity', '1');
        });
      }

      if (isDonut && this._centerTextValue && this._centerTextLabel) {
        this._centerTextValue.textContent = formatNumber(total, 0);
        this._centerTextLabel.textContent = 'total';
      }
    }

    /**
     * Animate pie slices with scale-in effect matching prototype
     * Each slice scales from 0→1 from the center with staggered delays
     * and a bounce easing curve.
     */
    animate() {
      const duration = this.config.style.animation?.duration || 600;

      if (!this.slices || !this.slices.length) return;
      if (!this._sliceElements || !this._sliceElements.length) return;

      const cx = this.slices[0].centerX;
      const cy = this.slices[0].centerY;

      // Set all slices to scale(0) initially
      this._sliceElements.forEach(({ element }) => {
        if (!element) return;
        element.style.transformOrigin = `${cx}px ${cy}px`;
        element.style.transform = 'scale(0)';
        // Use a bouncy cubic-bezier for the scale-in, with stagger delay
        element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
      });

      // Stagger: trigger scale(1) per slice with increasing delay
      this._sliceElements.forEach(({ element }, i) => {
        if (!element) return;
        const delay = i * 40;
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, delay);
      });

      // After all animations complete, restore transition for hover effects
      const totalTime = duration + this._sliceElements.length * 40;
      setTimeout(() => {
        this._sliceElements.forEach(({ element }) => {
          if (!element) return;
          element.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out, filter 0.15s ease-out';
        });
      }, totalTime);
    }
  }

  /**
   * Line Chart implementation
   */


  class LineChart extends Chart {
    constructor(element, config = {}) {
      const mergedConfig = deepMerge(LINE_DEFAULTS, config);
      super(element, mergedConfig);
    }

    /**
     * Calculate coordinate transformations
     */
    calculateScales() {
      const layout = this.calculateLayout();
      const { data } = this.config;

      // Filter datasets by legend visibility
      const visibleDatasets = data.datasets.filter((ds, i) => this.isDatasetVisible(ds, i));

      let allValues = [];
      visibleDatasets.forEach(ds => {
        if (ds.values) {
          allValues = allValues.concat(ds.values);
        }
      });

      if (allValues.length === 0) allValues = [0];

      const { min: minValue, max: maxValue } = getMinMax(allValues);
      const valueRange = maxValue - minValue || 1;
      const scale = generateScale(minValue, maxValue, 5);

      const numPoints = data.labels?.length || 0;
      const pointSpacing = numPoints > 1 ? layout.chartWidth / (numPoints - 1) : 0;

      return {
        layout,
        visibleDatasets,
        minValue,
        maxValue,
        valueRange,
        scale,
        numPoints,
        pointSpacing
      };
    }

    /**
     * Render line chart
     */
    render() {
      const { style, data, options } = this.config;
      const scales = this.calculateScales();
      const { layout, visibleDatasets, minValue, maxValue, valueRange, scale, numPoints, pointSpacing } = scales;

      const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = layout;

      const valueToY = (value) => chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
      const indexToX = (index) => chartX + index * pointSpacing;

      // Draw grid
      if (style.grid?.color) {
        scale.forEach((value) => {
          const y = valueToY(value);
          this.renderer.line(chartX, y, chartX + chartWidth, y, {
            stroke: style.grid.color,
            strokeWidth: style.grid.width || 1,
            opacity: 0.5
          });

          if (hasYAxis) {
            this.renderer.text(formatNumber(value, 0), chartX - 10, y, {
              fill: style.axis.color,
              fontSize: style.axis.fontSize,
              fontFamily: style.fontFamily,
              textAnchor: 'end',
              dominantBaseline: 'middle'
            });
          }
        });
      }

      // Draw axes
      if (hasYAxis) {
        this.renderer.line(chartX, chartY, chartX, chartY + chartHeight, {
          stroke: style.axis.color,
          strokeWidth: style.axis.width
        });
      }

      if (hasXAxis) {
        this.renderer.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight, {
          stroke: style.axis.color,
          strokeWidth: style.axis.width
        });
      }

      // Draw lines and points
      this.lines = [];
      this._allPoints = [];
      this._crosshairLine = null;

      visibleDatasets.forEach((dataset, datasetIndex) => {
        if (!dataset.values) return;

        const color = dataset.color || this.getPaletteColor(datasetIndex);
        const lineWidth = dataset.strokeWidth || style.line?.width || 2;
        const smooth = options.smooth;
        const tension = (smooth === true || smooth === 'bezier') ? (style.line?.tension || 0.4) : 0;
        const pointRadius = options.showPoints ? (style.line?.pointRadius || 4) : 0;
        const isDashed = dataset.dash || false;

        // Prepare points
        const points = dataset.values.map((value, index) => [
          indexToX(index),
          valueToY(value)
        ]);

        // Build smooth path helper
        const buildPath = (pts) => {
          if (smooth === 'monotone') return getMonotonePath(pts);
          if (tension > 0) return getBezierPath(pts, tension);
          return `M ${pts.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
        };

        // Draw area fill with gradient if enabled
        if (options.fill && !isDashed) {
          const gradientId = `area-grad-${datasetIndex}`;
          const gradientFill = this.renderer.createGradient?.(color, gradientId) || null;

          if (gradientFill) {
            // Build closed area path
            const linePath = buildPath(points);
            const lastX = points[points.length - 1][0];
            const firstX = points[0][0];
            const baseline = chartY + chartHeight;
            const areaD = `${linePath} L ${lastX},${baseline} L ${firstX},${baseline} Z`;

            this.renderer.path(areaD, {
              fill: gradientFill,
              opacity: 1
            });
          } else {
            // Canvas fallback — simple opacity fill
            const areaPoints = [
              ...points,
              [indexToX(points.length - 1), chartY + chartHeight],
              [indexToX(0), chartY + chartHeight]
            ];
            const areaPath = buildPath(areaPoints);
            this.renderer.path(areaPath, {
              fill: color,
              opacity: 0.1
            });
          }
        }

        // Draw line
        const linePath = buildPath(points);

        const lineElement = this.renderer.path(linePath, {
          stroke: color,
          strokeWidth: lineWidth,
          strokeDasharray: isDashed ? (dataset.dashPattern || '5 3') : undefined,
          opacity: 1
        });

        // Draw points (hidden initially for crosshair interaction)
        const pointElements = [];
        points.forEach((point, pointIndex) => {
          if (pointRadius > 0) {
            const pointEl = this.renderer.circle(point[0], point[1], pointRadius, {
              fill: color,
              stroke: style.line?.pointBorderColor || '#ffffff',
              strokeWidth: style.line?.pointBorderWidth || 2,
              opacity: 0 // hidden by default, shown on crosshair hover
            });

            pointElements.push(pointEl);
            this._allPoints.push({
              element: pointEl,
              x: point[0],
              y: point[1],
              value: dataset.values[pointIndex],
              labelIndex: pointIndex,
              datasetIndex,
              color,
              datasetLabel: dataset.label
            });
          }
        });

        this.lines.push({
          element: lineElement,
          points,
          pointElements,
          color,
          datasetLabel: dataset.label
        });
      });

      // Create crosshair line (hidden)
      this._crosshairLine = this.renderer.line(0, chartY, 0, chartY + chartHeight, {
        stroke: style.grid?.color || '#dfe1e6',
        strokeWidth: 1,
        strokeDasharray: '3 3',
        opacity: 0
      });

      // Invisible hit areas for each x-position (crosshair columns)
      if (numPoints > 0) {
        const colWidth = pointSpacing > 0 ? pointSpacing : chartWidth;
        for (let i = 0; i < numPoints; i++) {
          const cx = indexToX(i);
          const hitX = cx - colWidth / 2;

          const hitbox = this.renderer.rect(hitX, chartY, colWidth, chartHeight, {
            fill: 'transparent',
            opacity: 0
          });

          if (hitbox) {
            hitbox.style.cursor = 'crosshair';

            this.addElementListener(hitbox, 'mouseenter', (e) => {
              // Show crosshair
              if (this._crosshairLine) {
                this._crosshairLine.setAttribute('x1', cx);
                this._crosshairLine.setAttribute('x2', cx);
                this._crosshairLine.setAttribute('opacity', '1');
              }

              // Show points at this index and build rich tooltip
              const rows = [];
              let currentValue = null;
              let prevValue = null;

              this._allPoints.forEach(pt => {
                if (pt.labelIndex === i) {
                  if (pt.element) {
                    pt.element.setAttribute('opacity', '1');
                  }
                  const dataset = visibleDatasets[pt.datasetIndex];
                  const isDashed = dataset?.dash || dataset?.ref || false;
                  rows.push({
                    color: pt.color,
                    label: pt.datasetLabel || 'Value',
                    value: formatNumber(pt.value, 0),
                    style: isDashed ? 'dashed' : 'solid'
                  });

                  if (pt.datasetIndex === 0) currentValue = pt.value;
                  if (pt.datasetIndex === 1) prevValue = pt.value;
                }
              });

              let footer = null;
              if (currentValue != null && prevValue != null && prevValue !== 0) {
                const change = ((currentValue - prevValue) / prevValue) * 100;
                const isPositive = change >= 0;
                const ds0Label = rows[0]?.label || '';
                const ds1Label = rows[1]?.label || '';
                footer = {
                  label: options.tooltipChangeLabel || `${ds0Label} vs ${ds1Label}:`,
                  value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
                  color: isPositive ? '#69db7c' : '#ff8787'
                };
              }

              this.showTooltip(e, {
                header: data.labels?.[i] || '',
                rows,
                footer
              });

              if (typeof options.onHover === 'function') {
                options.onHover(i, data.labels?.[i] || '');
              }
            });

            this.addElementListener(hitbox, 'mouseleave', () => {
              this._clearPointHighlight();

              if (typeof options.onHoverEnd === 'function') {
                options.onHoverEnd();
              }
            });
          }
        }
      }

      // Draw X axis labels
      if (hasXAxis) {
        data.labels?.forEach((label, index) => {
          this.renderer.text(label, indexToX(index), chartY + chartHeight + 15, {
            fill: style.axis.color,
            fontSize: style.axis.fontSize,
            fontFamily: style.fontFamily,
            textAnchor: 'middle',
            dominantBaseline: 'top'
          });
        });
      }
    }

    /**
     * Programmatically highlight a data point column by index
     * @param {number} index - Label index to highlight
     */
    highlightColumn(index) {
      if (!this._allPoints || !this._crosshairLine) return;

      const { data } = this.config;
      const scales = this.calculateScales();
      const { pointSpacing, layout } = scales;
      const cx = layout.chartX + index * pointSpacing;

      this._crosshairLine.setAttribute('x1', cx);
      this._crosshairLine.setAttribute('x2', cx);
      this._crosshairLine.setAttribute('opacity', '1');

      this._allPoints.forEach(pt => {
        if (pt.element) {
          pt.element.setAttribute('opacity', pt.labelIndex === index ? '1' : '0');
        }
      });
    }

    /**
     * Clear all highlights
     */
    clearHighlight() {
      this._clearPointHighlight();
    }

    /**
     * Internal: reset crosshair and points
     */
    _clearPointHighlight() {
      if (this._crosshairLine) {
        this._crosshairLine.setAttribute('opacity', '0');
      }
      if (this._allPoints) {
        this._allPoints.forEach(pt => {
          if (pt.element) {
            pt.element.setAttribute('opacity', '0');
          }
        });
      }
    }

    /**
     * Animate line drawing
     */
    animate() {
      const duration = this.config.style.animation?.duration || 600;
      const easing = this.config.style.animation?.easing || 'easeOutCubic';

      if (!this.lines || !this.lines.length) return;

      this.lines.forEach((line) => {
        this.animateValue({
          from: 0,
          to: 1,
          duration: duration,
          easing: easing,
          onUpdate: (progress) => {
            if (!line.element) return;

            const pathEl = line.element;
            const totalLength = pathEl.getTotalLength?.() || 0;

            if (totalLength > 0) {
              pathEl.style.strokeDasharray = totalLength;
              pathEl.style.strokeDashoffset = totalLength * (1 - progress);
            }
          }
        });
      });
    }
  }

  /**
   * Area Chart implementation
   * Extends LineChart with gradient fill enabled by default
   */


  class AreaChart extends Chart {
    constructor(element, config = {}) {
      const mergedConfig = deepMerge(AREA_DEFAULTS, config);
      super(element, mergedConfig);
    }

    /**
     * Calculate coordinate transformations
     */
    calculateScales() {
      const layout = this.calculateLayout();
      const { data } = this.config;

      const visibleDatasets = data.datasets.filter((ds, i) => this.isDatasetVisible(ds, i));

      let allValues = [];
      visibleDatasets.forEach(ds => {
        if (ds.values) allValues = allValues.concat(ds.values);
      });
      if (allValues.length === 0) allValues = [0];

      const { min: minValue, max: maxValue } = getMinMax(allValues);
      const valueRange = maxValue - minValue || 1;
      const scale = generateScale(minValue, maxValue, 5);

      const numPoints = data.labels?.length || 0;
      const pointSpacing = numPoints > 1 ? layout.chartWidth / (numPoints - 1) : 0;

      return { layout, visibleDatasets, minValue, maxValue, valueRange, scale, numPoints, pointSpacing };
    }

    /**
     * Render area chart
     */
    render() {
      const { style, data, options } = this.config;
      const scales = this.calculateScales();
      const { layout, visibleDatasets, minValue, maxValue, valueRange, scale, numPoints, pointSpacing } = scales;
      const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = layout;

      const stacked = options.stacked || false;
      const valueToY = (value) => chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
      const indexToX = (index) => chartX + index * pointSpacing;
      const baseline = chartY + chartHeight;

      // Draw grid
      if (style.grid?.color) {
        scale.forEach((value) => {
          const y = valueToY(value);
          this.renderer.line(chartX, y, chartX + chartWidth, y, {
            stroke: style.grid.color,
            strokeWidth: style.grid.width || 1,
            opacity: 0.5
          });

          if (hasYAxis) {
            this.renderer.text(formatNumber(value, 0), chartX - 10, y, {
              fill: style.axis.color,
              fontSize: style.axis.fontSize,
              fontFamily: style.fontFamily,
              textAnchor: 'end',
              dominantBaseline: 'middle'
            });
          }
        });
      }

      // Draw axes
      if (hasYAxis) {
        this.renderer.line(chartX, chartY, chartX, chartY + chartHeight, {
          stroke: style.axis.color, strokeWidth: style.axis.width
        });
      }
      if (hasXAxis) {
        this.renderer.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight, {
          stroke: style.axis.color, strokeWidth: style.axis.width
        });
      }

      // Calculate stacked values if needed
      let stackedSums = null;
      if (stacked && visibleDatasets.length > 1) {
        stackedSums = new Array(numPoints).fill(0);
      }

      this.lines = [];
      this._allPoints = [];
      this._crosshairLine = null;

      const smooth = options.smooth;
      const tension = (smooth === true || smooth === 'bezier') ? (style.line?.tension || 0.4) : 0;
      const fillOpacity = style.area?.fillOpacity ?? 0.25;

      const buildPath = (pts) => {
        if (smooth === 'monotone') return getMonotonePath(pts);
        if (tension > 0) return getBezierPath(pts, tension);
        return `M ${pts.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
      };

      visibleDatasets.forEach((dataset, datasetIndex) => {
        if (!dataset.values) return;

        const color = dataset.color || this.getPaletteColor(datasetIndex);
        const lineWidth = dataset.strokeWidth || style.line?.width || 2;
        const isDashed = dataset.dash || false;

        // Build points, accounting for stacking
        const points = dataset.values.map((value, index) => {
          let y;
          if (stacked && stackedSums) {
            stackedSums[index] += value;
            y = valueToY(stackedSums[index]);
          } else {
            y = valueToY(value);
          }
          return [indexToX(index), y];
        });

        // Build bottom edge for fill (previous stack or baseline)
        let bottomPoints;
        if (stacked && stackedSums && datasetIndex > 0) {
          // Bottom is previous cumulative
          const prevSums = new Array(numPoints).fill(0);
          for (let di = 0; di < datasetIndex; di++) {
            const ds = visibleDatasets[di];
            if (ds.values) {
              ds.values.forEach((v, i) => { prevSums[i] += v; });
            }
          }
          bottomPoints = prevSums.map((sum, i) => [indexToX(i), valueToY(sum)]).reverse();
        } else {
          bottomPoints = [
            [points[points.length - 1][0], baseline],
            [points[0][0], baseline]
          ];
        }

        // Draw area fill
        const gradientId = `area-grad-${datasetIndex}`;
        const gradientFill = this.renderer.createGradient?.(color, gradientId, fillOpacity, 0.02) || null;

        if (gradientFill) {
          const linePath = buildPath(points);
          const bottomPath = stacked && datasetIndex > 0
            ? ` L ${bottomPoints[0][0]},${bottomPoints[0][1]}` + buildPath(bottomPoints).replace(/^M/, ' L')
            : ` L ${bottomPoints[0][0]},${bottomPoints[0][1]} L ${bottomPoints[1][0]},${bottomPoints[1][1]}`;
          const areaD = `${linePath}${bottomPath} Z`;
          this.renderer.path(areaD, { fill: gradientFill, opacity: 1 });
        } else {
          // Canvas fallback
          const areaPoints = [...points, ...bottomPoints];
          const areaPath = `M ${areaPoints.map(p => `${p[0]} ${p[1]}`).join(' L ')} Z`;
          this.renderer.path(areaPath, { fill: color, opacity: fillOpacity * 0.5 });
        }

        // Draw line on top
        const linePath = buildPath(points);

        const lineElement = this.renderer.path(linePath, {
          stroke: color,
          strokeWidth: lineWidth,
          strokeDasharray: isDashed ? (dataset.dashPattern || '5 3') : undefined,
          opacity: 1
        });

        // Draw points (hidden, shown on crosshair)
        const pointRadius = options.showPoints !== false ? (style.line?.pointRadius || 4) : 0;
        const pointElements = [];
        points.forEach((point, pointIndex) => {
          if (pointRadius > 0) {
            const pointEl = this.renderer.circle(point[0], point[1], pointRadius, {
              fill: color,
              stroke: style.line?.pointBorderColor || '#ffffff',
              strokeWidth: style.line?.pointBorderWidth || 2,
              opacity: 0
            });
            pointElements.push(pointEl);
            this._allPoints.push({
              element: pointEl, x: point[0], y: point[1],
              value: dataset.values[pointIndex],
              labelIndex: pointIndex, datasetIndex, color,
              datasetLabel: dataset.label
            });
          }
        });

        this.lines.push({ element: lineElement, points, pointElements, color, datasetLabel: dataset.label });
      });

      // Crosshair line
      this._crosshairLine = this.renderer.line(0, chartY, 0, chartY + chartHeight, {
        stroke: style.grid?.color || '#dfe1e6', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0
      });

      // Hit areas for crosshair
      if (numPoints > 0) {
        const colWidth = pointSpacing > 0 ? pointSpacing : chartWidth;
        for (let i = 0; i < numPoints; i++) {
          const cx = indexToX(i);
          const hitX = cx - colWidth / 2;

          const hitbox = this.renderer.rect(hitX, chartY, colWidth, chartHeight, {
            fill: 'transparent', opacity: 0
          });

          if (hitbox) {
            hitbox.style.cursor = 'crosshair';

            this.addElementListener(hitbox, 'mouseenter', (e) => {
              if (this._crosshairLine) {
                this._crosshairLine.setAttribute('x1', cx);
                this._crosshairLine.setAttribute('x2', cx);
                this._crosshairLine.setAttribute('opacity', '1');
              }
              const tooltipData = {};
              this._allPoints.forEach(pt => {
                if (pt.labelIndex === i) {
                  if (pt.element) pt.element.setAttribute('opacity', '1');
                  tooltipData[pt.datasetLabel || 'Value'] = formatNumber(pt.value, 0);
                }
              });
              this.showTooltip(e, tooltipData);
            });

            this.addElementListener(hitbox, 'mouseleave', () => {
              if (this._crosshairLine) {
                this._crosshairLine.setAttribute('opacity', '0');
              }
              this._allPoints.forEach(pt => {
                if (pt.element) pt.element.setAttribute('opacity', '0');
              });
            });
          }
        }
      }

      // X axis labels
      if (hasXAxis) {
        data.labels?.forEach((label, index) => {
          this.renderer.text(label, indexToX(index), chartY + chartHeight + 15, {
            fill: style.axis.color, fontSize: style.axis.fontSize,
            fontFamily: style.fontFamily, textAnchor: 'middle', dominantBaseline: 'top'
          });
        });
      }
    }

    /**
     * Animate area drawing
     */
    animate() {
      const duration = this.config.style.animation?.duration || 600;
      const easing = this.config.style.animation?.easing || 'easeOutCubic';

      if (!this.lines || !this.lines.length) return;

      this.lines.forEach((line) => {
        this.animateValue({
          from: 0, to: 1, duration, easing,
          onUpdate: (progress) => {
            if (!line.element) return;
            const pathEl = line.element;
            const totalLength = pathEl.getTotalLength?.() || 0;
            if (totalLength > 0) {
              pathEl.style.strokeDasharray = totalLength;
              pathEl.style.strokeDashoffset = totalLength * (1 - progress);
            }
          }
        });
      });
    }
  }

  /**
   * Gauge Chart implementation
   * Circular gauge with threshold zones, center value display, and optional target marker
   * Supports variants: arc (default), ring, linear, compact
   */


  class GaugeChart extends Chart {
    constructor(element, config = {}) {
      const mergedConfig = deepMerge(GAUGE_DEFAULTS, config);
      super(element, mergedConfig);
    }

    /**
     * Calculate gauge geometry optimized for semicircular arc
     * @returns {Object} Gauge layout parameters
     */
    calculateLayout() {
      const padding = this.config.options.padding || 20;
      const hasNeedle = this.config.style.gauge?.needle !== false;
      const hasTicks = (this.config.options.ticks ?? 5) > 0;

      // Space needed outside the arc for tick marks and labels
      const tickMargin = hasTicks ? 35 : 8;
      // Space below center for value text, label, and "av X" sub-label
      const textBelow = hasNeedle ? 75 : 50;

      // Width constraint: arc diameter + tick labels on each side
      const maxRW = (this.width - 2 * padding) / 2 - tickMargin;

      // Height constraints for a 270° arc:
      // - Above center: radius extends to arc top, plus tick margin
      // - Below center: arc endpoints at 0.707*r, plus text below center
      // Constraint 1: padding + tickMargin + radius + 0.707*radius ≤ height - padding
      const rFromArc = (this.height - 2 * padding - tickMargin) / 1.707;
      // Constraint 2: padding + tickMargin + radius + textBelow ≤ height - padding
      const rFromText = this.height - 2 * padding - tickMargin - textBelow;

      const radius = Math.max(Math.min(maxRW, rFromArc, rFromText), 60);

      // Position center so the gauge is vertically centered in available space
      const cx = this.width / 2;
      const contentBottom = Math.max(0.707 * radius, textBelow);
      const totalContent = radius + tickMargin + contentBottom;
      const cy = padding + tickMargin + radius + (this.height - 2 * padding - totalContent) / 2;

      const arcWidth = this.config.style.gauge?.arcWidth || radius * 0.18;

      return { cx, cy, radius, arcWidth, padding };
    }

    /**
     * Convert a value to an angle on the gauge arc
     * @param {number} value - Data value
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {number} startAngle - Arc start angle (radians)
     * @param {number} sweep - Arc sweep angle (radians)
     * @returns {number} Angle in radians
     */
    valueToAngle(value, min, max, startAngle, sweep) {
      const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
      return startAngle + ratio * sweep;
    }

    /**
     * Build an SVG arc path
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} outerR - Outer radius
     * @param {number} innerR - Inner radius
     * @param {number} startAngle - Start angle (radians)
     * @param {number} endAngle - End angle (radians)
     * @returns {string} SVG path data
     */
    arcPath(cx, cy, outerR, innerR, startAngle, endAngle, { roundStart = false, roundEnd = false } = {}) {
      const cos = Math.cos;
      const sin = Math.sin;

      const x1 = cx + outerR * cos(startAngle);
      const y1 = cy + outerR * sin(startAngle);
      const x2 = cx + outerR * cos(endAngle);
      const y2 = cy + outerR * sin(endAngle);
      const x3 = cx + innerR * cos(endAngle);
      const y3 = cy + innerR * sin(endAngle);
      const x4 = cx + innerR * cos(startAngle);
      const y4 = cy + innerR * sin(startAngle);

      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const capR = (outerR - innerR) / 2;

      return [
        `M ${x1} ${y1}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
        roundEnd
          ? `A ${capR} ${capR} 0 0 1 ${x3} ${y3}`
          : `L ${x3} ${y3}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
        roundStart
          ? `A ${capR} ${capR} 0 0 1 ${x1} ${y1}`
          : 'Z'
      ].join(' ');
    }

    /**
     * Dispatch render to variant-specific method
     */
    render() {
      const variant = this.config.options.variant || 'arc';

      switch (variant) {
        case 'ring':
          this.renderRing();
          break;
        case 'linear':
          this.renderLinear();
          break;
        case 'compact':
          this.renderCompact();
          break;
        default:
          this.renderArc();
          break;
      }
    }

    /**
     * Render classic semicircular arc gauge (default)
     */
    renderArc() {
      const { style, data, options } = this.config;
      const { cx, cy, radius, arcWidth } = this.calculateLayout();

      const dataset = data.datasets[0];
      if (!dataset) return;

      const value = dataset.values?.[0] ?? 0;
      const min = options.min ?? 0;
      const max = options.max ?? 100;
      const target = options.target;

      // Arc geometry — 240 degree sweep, centered at bottom
      const startAngle = options.startAngle ?? (Math.PI * 0.75);
      const sweep = options.sweep ?? (Math.PI * 1.5);
      const endAngle = startAngle + sweep;

      const outerR = radius;
      const innerR = radius - arcWidth;

      // Threshold zones
      const zones = options.zones || style.gauge?.zones || [
        { from: 0, to: 0.6, color: '#e03131' },
        { from: 0.6, to: 0.85, color: '#f08c00' },
        { from: 0.85, to: 1.0, color: '#0ca678' }
      ];

      const roundedEnds = style.gauge?.roundedEnds === true;

      // Draw background track
      const trackColor = style.gauge?.trackColor || '#f1f3f5';
      this.renderer.path(
        this.arcPath(cx, cy, outerR, innerR, startAngle, endAngle, {
          roundStart: roundedEnds, roundEnd: roundedEnds
        }),
        { fill: trackColor }
      );

      // Draw threshold zones
      const valueAngle = this.valueToAngle(value, min, max, startAngle, sweep);
      const visibleZones = [];
      zones.forEach(zone => {
        const zoneStart = startAngle + zone.from * sweep;
        const zoneEnd = startAngle + Math.min(zone.to, 1) * sweep;
        const drawEnd = Math.min(zoneEnd, valueAngle);

        if (drawEnd > zoneStart) {
          visibleZones.push({ start: zoneStart, end: drawEnd, color: zone.color });
        }
      });

      visibleZones.forEach((vz, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === visibleZones.length - 1;
        this.renderer.path(
          this.arcPath(cx, cy, outerR, innerR, vz.start, vz.end, {
            roundStart: roundedEnds && isFirst,
            roundEnd: roundedEnds && isLast
          }),
          { fill: vz.color, opacity: 1 }
        );
      });

      // Draw tick marks
      const ticks = options.ticks ?? 5;
      if (ticks > 0) {
        for (let i = 0; i <= ticks; i++) {
          const ratio = i / ticks;
          const angle = startAngle + ratio * sweep;
          const tickValue = min + ratio * (max - min);

          // Tick line
          const tickOuterR = outerR + 4;
          const tickInnerR = outerR + 10;
          this.renderer.line(
            cx + tickOuterR * Math.cos(angle), cy + tickOuterR * Math.sin(angle),
            cx + tickInnerR * Math.cos(angle), cy + tickInnerR * Math.sin(angle),
            { stroke: style.axis?.color || '#8993a4', strokeWidth: 1.5 }
          );

          // Tick label
          const labelR = outerR + 22;
          this.renderer.text(
            formatNumber(tickValue, 0),
            cx + labelR * Math.cos(angle),
            cy + labelR * Math.sin(angle),
            {
              fill: style.axis?.color || '#8993a4',
              fontSize: style.gauge?.tickFontSize || 10,
              fontFamily: style.fontFamily,
              textAnchor: 'middle',
              dominantBaseline: 'middle'
            }
          );
        }
      }

      // Draw target marker
      if (target != null) {
        const targetAngle = this.valueToAngle(target, min, max, startAngle, sweep);
        const markerOuterR = outerR + 2;
        const markerInnerR = innerR - 2;

        this.renderer.line(
          cx + markerOuterR * Math.cos(targetAngle), cy + markerOuterR * Math.sin(targetAngle),
          cx + markerInnerR * Math.cos(targetAngle), cy + markerInnerR * Math.sin(targetAngle),
          {
            stroke: options.targetColor || style.fontColor || '#1a1d23',
            strokeWidth: 2.5,
            strokeLinecap: 'round'
          }
        );

        // Target label
        if (options.targetLabel !== false) {
          const targetLabelR = outerR + 32;
          this.renderer.text(
            options.targetLabel || `Mal: ${formatNumber(target, 0)}`,
            cx + targetLabelR * Math.cos(targetAngle),
            cy + targetLabelR * Math.sin(targetAngle),
            {
              fill: style.fontColor || '#5e6c84',
              fontSize: 9,
              fontFamily: style.fontFamily,
              textAnchor: 'middle',
              dominantBaseline: 'middle'
            }
          );
        }
      }

      // Needle
      if (style.gauge?.needle !== false) {
        const needleAngle = this.valueToAngle(value, min, max, startAngle, sweep);
        const needleLength = innerR - 8;
        const needleWidth = 3;

        // Needle path (triangle from center to value)
        const nx = cx + needleLength * Math.cos(needleAngle);
        const ny = cy + needleLength * Math.sin(needleAngle);
        const nlx = cx + needleWidth * Math.cos(needleAngle - Math.PI / 2);
        const nly = cy + needleWidth * Math.sin(needleAngle - Math.PI / 2);
        const nrx = cx + needleWidth * Math.cos(needleAngle + Math.PI / 2);
        const nry = cy + needleWidth * Math.sin(needleAngle + Math.PI / 2);

        this.renderer.path(
          `M ${nx} ${ny} L ${nlx} ${nly} L ${nrx} ${nry} Z`,
          { fill: options.needleColor || style.fontColor || '#1a1d23' }
        );

        // Center circle
        this.renderer.circle(cx, cy, 5, {
          fill: options.needleColor || style.fontColor || '#1a1d23'
        });
      }

      // Center value text
      const valueColor = this.getValueColor(value, min, max, zones);

      this._centerValue = this.renderer.text(
        this.formatValue(value),
        cx, cy + (style.gauge?.needle !== false ? 28 : 0),
        {
          fill: valueColor,
          fontSize: style.gauge?.valueFontSize || 28,
          fontFamily: style.monoFamily || style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        }
      );

      // Label text
      const label = dataset.label || data.labels?.[0] || '';
      if (label) {
        this.renderer.text(label, cx, cy + (style.gauge?.needle !== false ? 48 : 22), {
          fill: style.axis?.color || '#8993a4',
          fontSize: 11,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        });
      }

      // Sub-label (e.g., "av 100")
      if (options.showMax !== false) {
        this.renderer.text(
          `av ${formatNumber(max, 0)}`,
          cx, cy + (style.gauge?.needle !== false ? 62 : 36),
          {
            fill: style.grid?.color || '#b3bac5',
            fontSize: 9,
            fontFamily: style.fontFamily,
            textAnchor: 'middle',
            dominantBaseline: 'middle'
          }
        );
      }

      this._gaugeValue = value;
    }

    /**
     * Render ring gauge — full 360° donut with center value
     */
    renderRing() {
      const { style, data, options } = this.config;
      const padding = this.config.options.padding || 20;

      const dataset = data.datasets[0];
      if (!dataset) return;

      const value = dataset.values?.[0] ?? 0;
      const min = options.min ?? 0;
      const max = options.max ?? 100;
      const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

      const cx = this.width / 2;
      const cy = this.height / 2;
      const maxRadius = Math.min(this.width, this.height) / 2 - padding;
      const ringWidth = style.gauge?.arcWidth || Math.max(maxRadius * 0.2, 8);
      const outerR = maxRadius;
      const innerR = outerR - ringWidth;

      const zones = options.zones || style.gauge?.zones || [
        { from: 0, to: 0.6, color: '#e03131' },
        { from: 0.6, to: 0.85, color: '#f08c00' },
        { from: 0.85, to: 1.0, color: '#0ca678' }
      ];

      const trackColor = style.gauge?.trackColor || '#f1f3f5';
      const roundedEnds = style.gauge?.roundedEnds === true;
      const startAngle = -Math.PI / 2;
      const sweep = Math.PI * 2;

      // Background track — full circle (never rounded, it's a closed ring)
      this.renderer.path(
        this.arcPath(cx, cy, outerR, innerR, startAngle, startAngle + sweep - 0.001),
        { fill: trackColor }
      );

      // Filled arc with zone colors
      if (ratio > 0) {
        const valueEnd = startAngle + ratio * sweep;
        const visibleZones = [];
        zones.forEach(zone => {
          const zoneStart = startAngle + zone.from * sweep;
          const zoneEnd = startAngle + Math.min(zone.to, 1) * sweep;
          const drawEnd = Math.min(zoneEnd, valueEnd);

          if (drawEnd > zoneStart) {
            visibleZones.push({ start: zoneStart, end: drawEnd, color: zone.color });
          }
        });

        visibleZones.forEach((vz, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === visibleZones.length - 1;
          this.renderer.path(
            this.arcPath(cx, cy, outerR, innerR, vz.start, vz.end, {
              roundStart: roundedEnds && isFirst,
              roundEnd: roundedEnds && isLast
            }),
            { fill: vz.color }
          );
        });
      }

      // Center value
      const valueColor = this.getValueColor(value, min, max, zones);
      this.renderer.text(
        this.formatValue(value),
        cx, cy - 4,
        {
          fill: valueColor,
          fontSize: style.gauge?.valueFontSize || 28,
          fontFamily: style.monoFamily || style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        }
      );

      // Label
      const label = dataset.label || data.labels?.[0] || '';
      if (label) {
        this.renderer.text(label, cx, cy + 18, {
          fill: style.axis?.color || '#8993a4',
          fontSize: 11,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        });
      }

      this._gaugeValue = value;
    }

    /**
     * Render linear gauge — horizontal progress bar with zones
     */
    renderLinear() {
      const { style, data, options } = this.config;
      const padding = this.config.options.padding || 20;

      const dataset = data.datasets[0];
      if (!dataset) return;

      const value = dataset.values?.[0] ?? 0;
      const min = options.min ?? 0;
      const max = options.max ?? 100;
      const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
      const target = options.target;

      const zones = options.zones || style.gauge?.zones || [
        { from: 0, to: 0.6, color: '#e03131' },
        { from: 0.6, to: 0.85, color: '#f08c00' },
        { from: 0.85, to: 1.0, color: '#0ca678' }
      ];

      const trackColor = style.gauge?.trackColor || '#f1f3f5';
      const barHeight = style.gauge?.arcWidth || 16;
      const borderRadius = barHeight / 2;

      // Layout: value text on top, bar in center, labels below
      const barX = padding;
      const barWidth = this.width - 2 * padding;
      const barY = this.height / 2 - barHeight / 2 + 10;

      // Background track
      this.renderer.rect(barX, barY, barWidth, barHeight, {
        fill: trackColor,
        borderRadius
      });

      // Filled zones up to current value
      if (ratio > 0) {
        const fillWidth = barWidth * ratio;

        // Clip zones to filled width using individual rects
        zones.forEach(zone => {
          const zoneStartX = barX + zone.from * barWidth;
          const zoneEndX = barX + Math.min(zone.to, 1) * barWidth;
          const drawEndX = Math.min(zoneEndX, barX + fillWidth);

          if (drawEndX > zoneStartX) {
            const zoneWidth = drawEndX - zoneStartX;
            // Apply border radius only on edges
            const isFirst = zone.from === 0;
            const isLast = drawEndX >= barX + fillWidth - 0.5;

            this.renderer.rect(zoneStartX, barY, zoneWidth, barHeight, {
              fill: zone.color,
              borderRadius: isFirst && isLast ? borderRadius
                : isFirst ? `${borderRadius}px 0 0 ${borderRadius}px`
                : isLast ? `0 ${borderRadius}px ${borderRadius}px 0`
                : 0
            });
          }
        });
      }

      // Target marker
      if (target != null) {
        const targetRatio = Math.max(0, Math.min(1, (target - min) / (max - min)));
        const targetX = barX + targetRatio * barWidth;
        this.renderer.line(
          targetX, barY - 4,
          targetX, barY + barHeight + 4,
          {
            stroke: options.targetColor || style.fontColor || '#1a1d23',
            strokeWidth: 2,
            strokeLinecap: 'round'
          }
        );
        // Target label below bar
        this.renderer.text(
          options.targetLabel || formatNumber(target, 0),
          targetX, barY + barHeight + 18,
          {
            fill: style.fontColor || '#5e6c84',
            fontSize: 9,
            fontFamily: style.fontFamily,
            textAnchor: 'middle',
            dominantBaseline: 'middle'
          }
        );
      }

      // Value text above bar
      const valueColor = this.getValueColor(value, min, max, zones);
      this.renderer.text(
        this.formatValue(value),
        this.width / 2, barY - 18,
        {
          fill: valueColor,
          fontSize: style.gauge?.valueFontSize || 24,
          fontFamily: style.monoFamily || style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        }
      );

      // Label
      const label = dataset.label || data.labels?.[0] || '';
      if (label) {
        this.renderer.text(label, this.width / 2, barY - 38, {
          fill: style.axis?.color || '#8993a4',
          fontSize: 11,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        });
      }

      // Min/max labels
      this.renderer.text(formatNumber(min, 0), barX, barY + barHeight + 14, {
        fill: style.grid?.color || '#b3bac5',
        fontSize: 9,
        fontFamily: style.fontFamily,
        textAnchor: 'start',
        dominantBaseline: 'middle'
      });
      this.renderer.text(formatNumber(max, 0), barX + barWidth, barY + barHeight + 14, {
        fill: style.grid?.color || '#b3bac5',
        fontSize: 9,
        fontFamily: style.fontFamily,
        textAnchor: 'end',
        dominantBaseline: 'middle'
      });

      this._gaugeValue = value;
    }

    /**
     * Render compact gauge — minimal semicircular arc, no needle/ticks
     */
    renderCompact() {
      const { style, data, options } = this.config;
      const padding = this.config.options.padding || 16;

      const dataset = data.datasets[0];
      if (!dataset) return;

      const value = dataset.values?.[0] ?? 0;
      const min = options.min ?? 0;
      const max = options.max ?? 100;

      const zones = options.zones || style.gauge?.zones || [
        { from: 0, to: 0.6, color: '#e03131' },
        { from: 0.6, to: 0.85, color: '#f08c00' },
        { from: 0.85, to: 1.0, color: '#0ca678' }
      ];

      const trackColor = style.gauge?.trackColor || '#f1f3f5';
      const roundedEnds = style.gauge?.roundedEnds === true;
      const labelPosition = options.labelPosition || 'below';

      // Arc geometry — 180 degree sweep (semicircle)
      const startAngle = Math.PI;
      const sweep = Math.PI;

      const cx = this.width / 2;
      // Fit semicircle: radius constrained by width and height
      const maxRadiusW = (this.width - 2 * padding) / 2;
      const maxRadiusH = this.height - 2 * padding - 40; // leave room for text below
      const radius = Math.max(Math.min(maxRadiusW, maxRadiusH), 30);
      const arcWidth = style.gauge?.arcWidth || Math.max(radius * 0.25, 10);
      const cy = padding + radius + 4;

      const outerR = radius;
      const innerR = radius - arcWidth;

      // Background track
      this.renderer.path(
        this.arcPath(cx, cy, outerR, innerR, startAngle, startAngle + sweep, {
          roundStart: roundedEnds, roundEnd: roundedEnds
        }),
        { fill: trackColor }
      );

      // Filled arc with zone colors
      const valueAngle = this.valueToAngle(value, min, max, startAngle, sweep);
      const visibleZones = [];
      zones.forEach(zone => {
        const zoneStart = startAngle + zone.from * sweep;
        const zoneEnd = startAngle + Math.min(zone.to, 1) * sweep;
        const drawEnd = Math.min(zoneEnd, valueAngle);

        if (drawEnd > zoneStart) {
          visibleZones.push({ start: zoneStart, end: drawEnd, color: zone.color });
        }
      });

      visibleZones.forEach((vz, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === visibleZones.length - 1;
        this.renderer.path(
          this.arcPath(cx, cy, outerR, innerR, vz.start, vz.end, {
            roundStart: roundedEnds && isFirst,
            roundEnd: roundedEnds && isLast
          }),
          { fill: vz.color }
        );
      });

      // Value and label positioning
      const valueColor = this.getValueColor(value, min, max, zones);
      const isInside = labelPosition === 'inside';

      // Value text
      this.renderer.text(
        this.formatValue(value),
        cx, isInside ? cy - radius * 0.35 : cy + 8,
        {
          fill: valueColor,
          fontSize: style.gauge?.valueFontSize || 24,
          fontFamily: style.monoFamily || style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        }
      );

      // Label
      const label = dataset.label || data.labels?.[0] || '';
      if (label) {
        this.renderer.text(label, cx, isInside ? cy - radius * 0.35 + 20 : cy + 28, {
          fill: style.axis?.color || '#8993a4',
          fontSize: 11,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        });
      }

      this._gaugeValue = value;
    }

    /**
     * Get color based on value position within zones
     * @param {number} value - Current value
     * @param {number} min - Min value
     * @param {number} max - Max value
     * @param {Array} zones - Threshold zones
     * @returns {string} Color hex
     */
    getValueColor(value, min, max, zones) {
      const ratio = (value - min) / (max - min);
      for (let i = zones.length - 1; i >= 0; i--) {
        if (ratio >= zones[i].from) return zones[i].color;
      }
      return zones[0]?.color || '#374151';
    }

    /**
     * Format the center value display
     * @param {number} value - Value to format
     * @returns {string} Formatted string
     */
    formatValue(value) {
      const formatter = this.config.options.formatValue;
      if (typeof formatter === 'function') return formatter(value);

      const suffix = this.config.options.valueSuffix || '';
      const prefix = this.config.options.valuePrefix || '';
      return prefix + formatNumber(value, this.config.options.valueDecimals ?? 0) + suffix;
    }

    /**
     * Animate gauge value sweep
     */
    animate() {
      const duration = this.config.style.animation?.duration || 800;
      const easing = this.config.style.animation?.easing || 'easeOutCubic';

      if (this._gaugeValue == null) return;

      const targetValue = this._gaugeValue;
      const origValues = this.config.data.datasets[0].values;

      // Redraw with animated value — guard against re-entrant animate()
      this._isAnimatingGauge = true;

      this.animateValue({
        from: this.config.options.min ?? 0,
        to: targetValue,
        duration,
        easing,
        onUpdate: (currentValue) => {
          this.config.data.datasets[0].values = [currentValue];

          this.renderer.clear();
          if (this.config.style.background) {
            this.renderer.rect(0, 0, this.width, this.height, { fill: this.config.style.background });
          }
          // Call variant render directly, bypassing draw() lifecycle
          const variant = this.config.options.variant || 'arc';
          switch (variant) {
            case 'ring': this.renderRing(); break;
            case 'linear': this.renderLinear(); break;
            case 'compact': this.renderCompact(); break;
            default: this.renderArc(); break;
          }
        },
        onComplete: () => {
          // Restore original values
          this.config.data.datasets[0].values = origValues;
          this._isAnimatingGauge = false;
        }
      });
    }
  }

  /**
   * Sparkline Chart implementation
   * Tiny inline chart without axes, legend, or tooltip — designed for KPI cards and table cells
   * Supports line, bar, and area variants
   */


  class SparklineChart extends Chart {
    constructor(element, config = {}) {
      const mergedConfig = deepMerge(SPARKLINE_DEFAULTS, config);
      super(element, mergedConfig);
    }

    /**
     * Override dimension calculation for sparklines — allow smaller sizes
     */
    updateDimensions() {
      const rect = this.element.getBoundingClientRect();
      this.width = rect.width || 120;
      this.height = rect.height || 32;

      if (this.renderer) {
        this.renderer.width = this.width;
        this.renderer.height = this.height;
      }
    }

    /**
     * Render sparkline
     */
    render() {
      const { style, data, options } = this.config;
      const dataset = data.datasets?.[0];
      if (!dataset?.values?.length) return;

      const values = dataset.values;
      const variant = options.variant || 'line';
      const color = dataset.color || this.getPaletteColor(0);
      const padX = style.sparkline?.paddingX ?? 2;
      const padY = style.sparkline?.paddingY ?? 4;

      const w = this.width - padX * 2;
      const h = this.height - padY * 2;

      const { min: dataMin, max: dataMax } = getMinMax(values);
      const min = options.min ?? dataMin;
      const max = options.max ?? dataMax;
      const range = max - min || 1;

      if (variant === 'bar') {
        this._renderBars(values, color, w, h, padX, padY, min, range);
      } else {
        this._renderLine(values, color, w, h, padX, padY, min, range, variant === 'area');
      }

      // Highlight last point
      if (options.highlightLast !== false && variant !== 'bar') {
        const lastIndex = values.length - 1;
        const lastX = padX + (lastIndex / (values.length - 1)) * w;
        const lastY = padY + h - ((values[lastIndex] - min) / range) * h;
        const dotRadius = style.sparkline?.dotRadius ?? 2.5;

        this.renderer.circle(lastX, lastY, dotRadius, {
          fill: color,
          stroke: style.background || '#ffffff',
          strokeWidth: 1.5
        });
      }

      // Reference line (e.g., zero line or target)
      if (options.referenceLine != null) {
        const refY = padY + h - ((options.referenceLine - min) / range) * h;
        this.renderer.line(padX, refY, padX + w, refY, {
          stroke: style.sparkline?.referenceColor || '#b3bac5',
          strokeWidth: 1,
          strokeDasharray: '3 2'
        });
      }
    }

    /**
     * Render line/area variant
     */
    _renderLine(values, color, w, h, padX, padY, min, range, isArea) {
      const { style, options } = this.config;
      const smooth = options.smooth;
      const tension = (smooth === true || smooth === 'bezier') ? (style.sparkline?.tension ?? 0.3) : 0;

      const buildPath = (pts) => {
        if (smooth === 'monotone') return getMonotonePath(pts);
        if (tension > 0) return getBezierPath(pts, tension);
        return `M ${pts.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
      };

      const points = values.map((v, i) => [
        padX + (i / (values.length - 1)) * w,
        padY + h - ((v - min) / range) * h
      ]);

      // Area fill
      if (isArea) {
        const gradientId = 'spark-area-0';
        const gradientFill = this.renderer.createGradient?.(color, gradientId, 0.2, 0.02) || null;
        const baseline = padY + h;

        if (gradientFill) {
          const linePath = buildPath(points);
          const areaD = `${linePath} L ${points[points.length - 1][0]},${baseline} L ${points[0][0]},${baseline} Z`;
          this.renderer.path(areaD, { fill: gradientFill });
        } else {
          const areaPoints = [...points, [points[points.length - 1][0], baseline], [points[0][0], baseline]];
          const areaPath = `M ${areaPoints.map(p => `${p[0]} ${p[1]}`).join(' L ')} Z`;
          this.renderer.path(areaPath, { fill: color, opacity: 0.1 });
        }
      }

      // Line
      const linePath = buildPath(points);

      this.renderer.path(linePath, {
        stroke: color,
        strokeWidth: style.sparkline?.lineWidth ?? 1.5,
        opacity: 1
      });
    }

    /**
     * Render bar variant
     */
    _renderBars(values, color, w, h, padX, padY, min, range) {
      const { style, options } = this.config;
      const gap = style.sparkline?.barGap ?? 1;
      const barWidth = (w - gap * (values.length - 1)) / values.length;
      const radius = style.sparkline?.barRadius ?? 1;
      const negativeColor = style.sparkline?.negativeColor || '#e03131';

      values.forEach((v, i) => {
        const x = padX + i * (barWidth + gap);
        const barH = ((v - min) / range) * h;
        const y = padY + h - barH;

        this.renderer.rect(x, y, Math.max(barWidth, 1), barH, {
          fill: v >= 0 ? color : negativeColor,
          borderRadius: radius
        });
      });
    }

    /**
     * Animate sparkline drawing
     */
    animate() {
      // Sparklines animate via line reveal
      const duration = this.config.style.animation?.duration || 400;
      const easing = this.config.style.animation?.easing || 'easeOutCubic';

      const pathEls = this.renderer.svg?.querySelectorAll('path[stroke]');
      if (!pathEls) return;

      pathEls.forEach(pathEl => {
        const totalLength = pathEl.getTotalLength?.() || 0;
        if (totalLength > 0) {
          this.animateValue({
            from: 0, to: 1, duration, easing,
            onUpdate: (progress) => {
              pathEl.style.strokeDasharray = totalLength;
              pathEl.style.strokeDashoffset = totalLength * (1 - progress);
            }
          });
        }
      });
    }
  }

  /**
   * Combo Chart implementation — mix bars and lines on shared axes
   */


  class ComboChart extends Chart {
    constructor(element, config = {}) {
      const mergedConfig = deepMerge(COMBO_DEFAULTS, config);
      super(element, mergedConfig);
    }

    /**
     * Calculate scales for all visible datasets
     */
    calculateScales() {
      const layout = this.calculateLayout();
      const { data, options } = this.config;

      const visibleDatasets = data.datasets.filter((ds, i) => this.isDatasetVisible(ds, i));

      // Separate bar and line datasets
      const barDatasets = [];
      const lineDatasets = [];
      visibleDatasets.forEach((ds, i) => {
        const dsType = ds.type || 'bar';
        if (dsType === 'line') {
          lineDatasets.push({ ...ds, _visibleIndex: i });
        } else {
          barDatasets.push({ ...ds, _visibleIndex: i });
        }
      });

      // Collect all values for unified scale
      let allValues = [];
      visibleDatasets.forEach(ds => {
        if (ds.values) allValues = allValues.concat(ds.values);
      });

      // Include reference line values
      const refLines = options.referenceLines || [];
      refLines.forEach(ref => {
        if (typeof ref.value === 'number') allValues.push(ref.value);
      });

      if (allValues.length === 0) allValues = [0];

      const { min: minValue, max: maxValue } = getMinMax(allValues);
      const valueRange = maxValue - minValue || 1;
      const scale = generateScale(minValue, maxValue, 5);

      const numPoints = data.labels?.length || 0;
      const barWidth = numPoints > 0 ? layout.chartWidth / numPoints : 0;
      const pointSpacing = numPoints > 1 ? layout.chartWidth / (numPoints - 1) : 0;

      return {
        layout,
        visibleDatasets,
        barDatasets,
        lineDatasets,
        minValue,
        maxValue,
        valueRange,
        scale,
        numPoints,
        barWidth,
        pointSpacing
      };
    }

    /**
     * Render combo chart
     */
    render() {
      const { style, data, options } = this.config;
      const scales = this.calculateScales();
      const {
        layout, visibleDatasets, barDatasets, lineDatasets,
        minValue, valueRange, scale, numPoints, barWidth, pointSpacing
      } = scales;
      const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = layout;

      const valueToY = (value) => chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
      const indexToX = (index) => chartX + index * barWidth + barWidth / 2;

      // Draw grid
      if (style.grid?.color) {
        scale.forEach((value) => {
          const y = valueToY(value);
          this.renderer.line(chartX, y, chartX + chartWidth, y, {
            stroke: style.grid.color,
            strokeWidth: style.grid.width || 1,
            opacity: 0.5
          });

          if (hasYAxis) {
            this.renderer.text(formatNumber(value, 0), chartX - 10, y, {
              fill: style.axis.color,
              fontSize: style.axis.fontSize,
              fontFamily: style.fontFamily,
              textAnchor: 'end',
              dominantBaseline: 'middle'
            });
          }
        });
      }

      // Draw axes
      if (hasYAxis) {
        this.renderer.line(chartX, chartY, chartX, chartY + chartHeight, {
          stroke: style.axis.color,
          strokeWidth: style.axis.width
        });
      }
      if (hasXAxis) {
        this.renderer.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight, {
          stroke: style.axis.color,
          strokeWidth: style.axis.width
        });
      }

      // Draw reference lines
      const refLines = options.referenceLines || [];
      refLines.forEach(ref => {
        let refValue = ref.value;
        if (ref.value === 'average' || ref.value === 'mean') {
          const firstDs = visibleDatasets[0];
          if (firstDs?.values) {
            refValue = Math.round(firstDs.values.reduce((s, v) => s + v, 0) / firstDs.values.length);
          }
        }
        if (typeof refValue !== 'number') return;

        const ry = valueToY(refValue);
        this.renderer.line(chartX, ry, chartX + chartWidth, ry, {
          stroke: ref.color || '#868e96',
          strokeWidth: ref.strokeWidth || 1.5,
          strokeDasharray: ref.dash || '6 4',
          strokeLinecap: 'round'
        });

        if (ref.label) {
          const labelX = ref.labelPosition === 'right' ? chartX + chartWidth - 6 : chartX + 4;
          const labelAnchor = ref.labelPosition === 'right' ? 'end' : 'start';
          this.renderer.text(ref.label, labelX, ry - 6, {
            fill: ref.color || '#868e96',
            fontSize: 9,
            fontFamily: style.monoFamily || style.fontFamily,
            textAnchor: labelAnchor,
            dominantBaseline: 'auto'
          });
        }
      });

      // --- Draw bars ---
      const bars_ = [];
      const barGroupData = [];
      const barGap = barWidth * (style.combo?.barGap ?? style.bar?.gap ?? 0.2);
      const availableWidth = barWidth - barGap;
      const numBarDatasets = barDatasets.length;
      const datasetWidth = numBarDatasets > 0 ? availableWidth / numBarDatasets : availableWidth;

      data.labels.forEach((label, labelIndex) => {
        const baseX = indexToX(labelIndex);
        const groupX = chartX + labelIndex * barWidth;

        const highlight = this.renderer.rect(groupX + 1, chartY, barWidth - 2, chartHeight, {
          fill: this.getPaletteColor(0),
          opacity: 0,
          borderRadius: 2
        });

        const groupBars = [];

        barDatasets.forEach((dataset, barIndex) => {
          const value = dataset.values?.[labelIndex] || 0;
          const normalizedValue = (value - minValue) / valueRange;
          const barHeight = normalizedValue * chartHeight;
          const x = baseX - availableWidth / 2 + barIndex * datasetWidth;
          const y = chartY + chartHeight - barHeight;
          const color = dataset.color || this.getPaletteColor(dataset._visibleIndex);

          const barElement = this.renderer.rect(x, y, datasetWidth, barHeight, {
            fill: color,
            borderRadius: style.combo?.barBorderRadius ?? style.bar?.borderRadius ?? 4,
            opacity: 1
          });

          if (barElement) {
            barElement.style.cursor = 'pointer';
            barElement.style.transition = 'opacity 0.12s, filter 0.12s';
          }

          const barInfo = {
            element: barElement,
            value,
            label,
            datasetLabel: dataset.label,
            color,
            x, y,
            width: datasetWidth,
            height: barHeight,
            labelIndex,
            datasetIndex: dataset._visibleIndex
          };

          bars_.push(barInfo);
          groupBars.push(barInfo);
        });

        barGroupData.push({ groupX, highlight, bars: groupBars, label, labelIndex });
      });

      // --- Draw lines ---
      this.lines = [];
      this._allPoints = [];
      this._crosshairLine = null;

      lineDatasets.forEach((dataset) => {
        if (!dataset.values) return;

        const color = dataset.color || this.getPaletteColor(dataset._visibleIndex);
        const lineWidth = dataset.strokeWidth || style.combo?.lineWidth || style.line?.width || 2;
        const smooth = options.smooth;
        const tension = (smooth === true || smooth === 'bezier') ? (style.combo?.tension ?? style.line?.tension ?? 0.4) : 0;
        const pointRadius = (options.showPoints !== false) ? (style.combo?.pointRadius ?? style.line?.pointRadius ?? 4) : 0;
        const isDashed = dataset.dash || false;

        // Line points use bar center positions for alignment
        const points = dataset.values.map((value, index) => [
          indexToX(index),
          valueToY(value)
        ]);

        // Draw line
        let linePath;
        if (smooth === 'monotone') {
          linePath = getMonotonePath(points);
        } else if (tension > 0) {
          linePath = getBezierPath(points, tension);
        } else {
          linePath = `M ${points.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
        }

        const lineElement = this.renderer.path(linePath, {
          stroke: color,
          strokeWidth: lineWidth,
          strokeDasharray: isDashed ? (dataset.dashPattern || '5 3') : undefined,
          opacity: 1
        });

        // Draw points
        const pointElements = [];
        points.forEach((point, pointIndex) => {
          if (pointRadius > 0) {
            const pointEl = this.renderer.circle(point[0], point[1], pointRadius, {
              fill: color,
              stroke: style.line?.pointBorderColor || '#ffffff',
              strokeWidth: style.line?.pointBorderWidth || 2,
              opacity: 0
            });

            pointElements.push(pointEl);
            this._allPoints.push({
              element: pointEl,
              x: point[0],
              y: point[1],
              value: dataset.values[pointIndex],
              labelIndex: pointIndex,
              datasetIndex: dataset._visibleIndex,
              color,
              datasetLabel: dataset.label
            });
          }
        });

        this.lines.push({
          element: lineElement,
          points,
          pointElements,
          color,
          datasetLabel: dataset.label
        });
      });

      // Crosshair line
      this._crosshairLine = this.renderer.line(0, chartY, 0, chartY + chartHeight, {
        stroke: style.grid?.color || '#dfe1e6',
        strokeWidth: 1,
        strokeDasharray: '3 3',
        opacity: 0
      });

      // --- Hitboxes (on top of everything) ---
      data.labels.forEach((label, i) => {
        const groupX = chartX + i * barWidth;
        const cx = indexToX(i);

        const hitbox = this.renderer.rect(groupX, chartY, barWidth, chartHeight, {
          fill: 'transparent',
          opacity: 0
        });

        if (hitbox) {
          hitbox.style.cursor = 'pointer';

          this.addElementListener(hitbox, 'mouseenter', (e) => {
            // Column highlight
            const group = barGroupData[i];
            if (group) group.highlight.setAttribute('opacity', '0.03');

            // Highlight bars
            bars_.forEach(bar => {
              if (!bar.element) return;
              if (bar.labelIndex === i) {
                bar.element.setAttribute('opacity', '1');
                bar.element.style.filter = 'brightness(1.08)';
              } else {
                bar.element.setAttribute('opacity', '0.3');
                bar.element.style.filter = '';
              }
            });

            // Show crosshair + points
            if (this._crosshairLine) {
              this._crosshairLine.setAttribute('x1', cx);
              this._crosshairLine.setAttribute('x2', cx);
              this._crosshairLine.setAttribute('opacity', '1');
            }
            this._allPoints.forEach(pt => {
              if (pt.element) {
                pt.element.setAttribute('opacity', pt.labelIndex === i ? '1' : '0');
              }
            });

            // Build tooltip
            const rows = [];
            // Bar rows
            if (group) {
              group.bars.forEach(bar => {
                rows.push({
                  color: bar.color,
                  label: bar.datasetLabel || 'Value',
                  value: formatNumber(bar.value, 0),
                  style: 'solid'
                });
              });
            }
            // Line rows
            this._allPoints.forEach(pt => {
              if (pt.labelIndex === i) {
                const ds = visibleDatasets[pt.datasetIndex];
                rows.push({
                  color: pt.color,
                  label: pt.datasetLabel || 'Value',
                  value: formatNumber(pt.value, 0),
                  style: ds?.dash ? 'dashed' : 'solid'
                });
              }
            });

            // Add reference line values
            refLines.forEach(ref => {
              let refValue = ref.value;
              if (ref.value === 'average' || ref.value === 'mean') {
                const firstDs = visibleDatasets[0];
                if (firstDs?.values) {
                  refValue = Math.round(firstDs.values.reduce((s, v) => s + v, 0) / firstDs.values.length);
                }
              }
              if (typeof refValue !== 'number') return;
              rows.push({
                color: ref.color || '#868e96',
                label: ref.label || 'Ref',
                value: formatNumber(refValue, 0),
                style: 'dashed'
              });
            });

            this.showTooltip(e, {
              header: label,
              rows
            });

            if (typeof options.onHover === 'function') {
              options.onHover(i, label);
            }
          });

          this.addElementListener(hitbox, 'mouseleave', () => {
            this._clearHighlights();
            if (typeof options.onHoverEnd === 'function') {
              options.onHoverEnd();
            }
          });
        }
      });

      // X axis labels
      if (hasXAxis) {
        data.labels?.forEach((label, index) => {
          this.renderer.text(label, indexToX(index), chartY + chartHeight + 15, {
            fill: style.axis.color,
            fontSize: style.axis.fontSize,
            fontFamily: style.fontFamily,
            textAnchor: 'middle',
            dominantBaseline: 'top'
          });
        });
      }

      this._barGroups = barGroupData;
      this.bars = bars_;
    }

    /**
     * Programmatically highlight a column
     * @param {number} index - Label index
     */
    highlightColumn(index) {
      if (!this._barGroups) return;
      const group = this._barGroups[index];
      if (group) group.highlight.setAttribute('opacity', '0.03');

      if (this.bars) {
        this.bars.forEach(bar => {
          if (!bar.element) return;
          if (bar.labelIndex === index) {
            bar.element.setAttribute('opacity', '1');
            bar.element.style.filter = 'brightness(1.08)';
          } else {
            bar.element.setAttribute('opacity', '0.3');
            bar.element.style.filter = '';
          }
        });
      }

      // Show line points
      if (this._allPoints) {
        this._allPoints.forEach(pt => {
          if (pt.element) {
            pt.element.setAttribute('opacity', pt.labelIndex === index ? '1' : '0');
          }
        });
      }
    }

    /**
     * Clear all highlights
     */
    clearHighlight() {
      this._clearHighlights();
    }

    /**
     * Internal: reset bars, points, crosshair
     */
    _clearHighlights() {
      if (this._barGroups) {
        this._barGroups.forEach(g => g.highlight.setAttribute('opacity', '0'));
      }
      if (this.bars) {
        this.bars.forEach(bar => {
          if (!bar.element) return;
          bar.element.setAttribute('opacity', '1');
          bar.element.style.filter = '';
        });
      }
      if (this._crosshairLine) {
        this._crosshairLine.setAttribute('opacity', '0');
      }
      if (this._allPoints) {
        this._allPoints.forEach(pt => {
          if (pt.element) pt.element.setAttribute('opacity', '0');
        });
      }
    }

    /**
     * Animate bars growing up and lines drawing in
     */
    animate() {
      const duration = this.config.style.animation?.duration || 600;
      const easing = this.config.style.animation?.easing || 'easeOutCubic';

      // Animate bars
      if (this.bars && this.bars.length) {
        this.bars.forEach((bar, index) => {
          const delay = (index / this.bars.length) * (duration * 0.3);
          setTimeout(() => {
            this.animateValue({
              from: 0,
              to: 1,
              duration,
              easing,
              onUpdate: (progress) => {
                const currentHeight = bar.height * progress;
                const y = bar.y + bar.height - currentHeight;
                if (bar.element) {
                  bar.element.setAttribute('height', currentHeight);
                  bar.element.setAttribute('y', y);
                }
              }
            });
          }, delay);
        });
      }

      // Animate lines
      if (this.lines && this.lines.length) {
        this.lines.forEach((line) => {
          this.animateValue({
            from: 0,
            to: 1,
            duration,
            easing,
            onUpdate: (progress) => {
              if (!line.element) return;
              const pathEl = line.element;
              const totalLength = pathEl.getTotalLength?.() || 0;
              if (totalLength > 0) {
                pathEl.style.strokeDasharray = totalLength;
                pathEl.style.strokeDashoffset = totalLength * (1 - progress);
              }
            }
          });
        });
      }
    }
  }

  /**
   * Scatter / Bubble Chart implementation
   *
   * Datasets use {x, y, size?, label?} point objects instead of flat value arrays.
   * When `size` is present on points, bubbles are drawn (radius scaled proportionally).
   */


  class ScatterChart extends Chart {
    constructor(element, config = {}) {
      const mergedConfig = deepMerge(SCATTER_DEFAULTS, config);
      super(element, mergedConfig);
    }

    /**
     * Calculate layout dimensions
     */
    calculateLayout() {
      const padding = this.config.options.padding || 20;
      const hasXAxis = this.config.options.axis?.x?.enabled !== false;
      const hasYAxis = this.config.options.axis?.y?.enabled !== false;

      const topSpace = this.config.options.legend?.enabled ? 40 : 0;
      const bottomSpace = hasXAxis ? 40 : padding;
      const leftSpace = hasYAxis ? 60 : padding;
      const rightSpace = padding + 10;

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
     * Calculate X and Y scales from point data
     */
    calculateScales() {
      const layout = this.calculateLayout();
      const { data } = this.config;

      const visibleDatasets = data.datasets.filter((ds, i) => this.isDatasetVisible(ds, i));

      let allX = [];
      let allY = [];
      let allSizes = [];

      visibleDatasets.forEach(ds => {
        const points = ds.values || ds.points || [];
        points.forEach(p => {
          if (p && typeof p.x === 'number') allX.push(p.x);
          if (p && typeof p.y === 'number') allY.push(p.y);
          if (p && typeof p.size === 'number') allSizes.push(p.size);
        });
      });

      if (allX.length === 0) allX = [0];
      if (allY.length === 0) allY = [0];

      const { min: minX, max: maxX } = getMinMax(allX);
      const { min: minY, max: maxY } = getMinMax(allY);
      const xRange = maxX - minX || 1;
      const yRange = maxY - minY || 1;
      const xScale = generateScale(minX, maxX, 5);
      const yScale = generateScale(minY, maxY, 5);

      // Bubble sizing
      const isBubble = allSizes.length > 0;
      const maxSize = allSizes.length > 0 ? Math.max(...allSizes) : 1;
      const minSize = allSizes.length > 0 ? Math.min(...allSizes) : 1;

      return {
        layout,
        visibleDatasets,
        minX, maxX, xRange, xScale,
        minY, maxY, yRange, yScale,
        isBubble, minSize, maxSize
      };
    }

    /**
     * Map data X value to pixel X
     */
    xToPixel(value, chartX, chartWidth, minX, xRange) {
      return chartX + ((value - minX) / xRange) * chartWidth;
    }

    /**
     * Map data Y value to pixel Y
     */
    yToPixel(value, chartY, chartHeight, minY, yRange) {
      return chartY + chartHeight - ((value - minY) / yRange) * chartHeight;
    }

    /**
     * Render scatter/bubble chart
     */
    render() {
      const { style, data, options } = this.config;
      const scales = this.calculateScales();
      const {
        layout, visibleDatasets,
        minX, maxX, xRange, xScale,
        minY, maxY, yRange, yScale,
        isBubble, minSize, maxSize
      } = scales;
      const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = layout;

      const scatterStyle = style.scatter || {};
      const minRadius = scatterStyle.minRadius || 4;
      const maxRadius = scatterStyle.maxRadius || 30;
      const defaultRadius = scatterStyle.pointRadius || 5;

      const toX = (v) => this.xToPixel(v, chartX, chartWidth, minX, xRange);
      const toY = (v) => this.yToPixel(v, chartY, chartHeight, minY, yRange);

      // Draw grid
      if (style.grid?.color) {
        // Horizontal grid (Y scale)
        yScale.forEach((value) => {
          const y = toY(value);
          this.renderer.line(chartX, y, chartX + chartWidth, y, {
            stroke: style.grid.color,
            strokeWidth: style.grid.width || 1,
            opacity: 0.5
          });

          if (hasYAxis) {
            this.renderer.text(formatNumber(value, 0), chartX - 10, y, {
              fill: style.axis.color,
              fontSize: style.axis.fontSize,
              fontFamily: style.fontFamily,
              textAnchor: 'end',
              dominantBaseline: 'middle'
            });
          }
        });

        // Vertical grid (X scale)
        xScale.forEach((value) => {
          const x = toX(value);
          this.renderer.line(x, chartY, x, chartY + chartHeight, {
            stroke: style.grid.color,
            strokeWidth: style.grid.width || 1,
            opacity: 0.3
          });

          if (hasXAxis) {
            this.renderer.text(formatNumber(value, 0), x, chartY + chartHeight + 15, {
              fill: style.axis.color,
              fontSize: style.axis.fontSize,
              fontFamily: style.fontFamily,
              textAnchor: 'middle',
              dominantBaseline: 'top'
            });
          }
        });
      }

      // Draw axes
      if (hasYAxis) {
        this.renderer.line(chartX, chartY, chartX, chartY + chartHeight, {
          stroke: style.axis.color,
          strokeWidth: style.axis.width
        });
      }
      if (hasXAxis) {
        this.renderer.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight, {
          stroke: style.axis.color,
          strokeWidth: style.axis.width
        });
      }

      // Axis labels
      const xLabel = options.axis?.x?.label;
      const yLabel = options.axis?.y?.label;
      if (xLabel && hasXAxis) {
        this.renderer.text(xLabel, chartX + chartWidth / 2, chartY + chartHeight + 32, {
          fill: style.axis.color,
          fontSize: style.axis.fontSize,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'top',
          fontWeight: 600
        });
      }
      if (yLabel && hasYAxis) {
        this.renderer.text(yLabel, 14, chartY + chartHeight / 2, {
          fill: style.axis.color,
          fontSize: style.axis.fontSize,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle',
          fontWeight: 600,
          transform: `rotate(-90, 14, ${chartY + chartHeight / 2})`
        });
      }

      // Draw reference lines
      const refLines = options.referenceLines || [];
      refLines.forEach(ref => {
        if (ref.axis === 'x' && typeof ref.value === 'number') {
          const rx = toX(ref.value);
          this.renderer.line(rx, chartY, rx, chartY + chartHeight, {
            stroke: ref.color || '#868e96',
            strokeWidth: ref.strokeWidth || 1.5,
            strokeDasharray: ref.dash || '6 4'
          });
          if (ref.label) {
            this.renderer.text(ref.label, rx + 4, chartY + 4, {
              fill: ref.color || '#868e96',
              fontSize: 9,
              fontFamily: style.monoFamily || style.fontFamily,
              textAnchor: 'start',
              dominantBaseline: 'hanging'
            });
          }
        } else if (typeof ref.value === 'number') {
          const ry = toY(ref.value);
          this.renderer.line(chartX, ry, chartX + chartWidth, ry, {
            stroke: ref.color || '#868e96',
            strokeWidth: ref.strokeWidth || 1.5,
            strokeDasharray: ref.dash || '6 4'
          });
          if (ref.label) {
            this.renderer.text(ref.label, chartX + 4, ry - 6, {
              fill: ref.color || '#868e96',
              fontSize: 9,
              fontFamily: style.monoFamily || style.fontFamily,
              textAnchor: 'start',
              dominantBaseline: 'auto'
            });
          }
        }
      });

      // Draw points
      this._points = [];

      visibleDatasets.forEach((dataset, datasetIndex) => {
        const points = dataset.values || dataset.points || [];
        const color = dataset.color || this.getPaletteColor(datasetIndex);
        const fillOpacity = isBubble ? (scatterStyle.bubbleOpacity || 0.6) : (scatterStyle.pointOpacity || 0.85);

        points.forEach((p, pointIndex) => {
          if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return;

          const px = toX(p.x);
          const py = toY(p.y);

          let radius;
          if (isBubble && typeof p.size === 'number' && maxSize > minSize) {
            const normalized = (p.size - minSize) / (maxSize - minSize);
            radius = minRadius + normalized * (maxRadius - minRadius);
          } else if (isBubble && typeof p.size === 'number') {
            radius = (minRadius + maxRadius) / 2;
          } else {
            radius = defaultRadius;
          }

          const el = this.renderer.circle(px, py, radius, {
            fill: color,
            opacity: fillOpacity,
            stroke: isBubble ? color : (style.scatter?.pointBorderColor || '#ffffff'),
            strokeWidth: isBubble ? 1 : (style.scatter?.pointBorderWidth || 2)
          });

          if (el) {
            el.style.cursor = 'pointer';
            el.style.transition = 'opacity 0.12s';

            this.addElementListener(el, 'mouseenter', (e) => {
              // Dim other points
              this._points.forEach(pt => {
                if (pt.element) {
                  pt.element.setAttribute('opacity', pt === info ? '1' : '0.2');
                }
              });
              el.setAttribute('opacity', '1');

              const rows = [{
                color,
                label: dataset.label || `Series ${datasetIndex + 1}`,
                value: `(${formatNumber(p.x, 1)}, ${formatNumber(p.y, 1)})`,
                style: 'solid'
              }];

              if (isBubble && typeof p.size === 'number') {
                rows.push({
                  color: '#8993a4',
                  label: options.sizeLabel || 'Size',
                  value: formatNumber(p.size, 0),
                  style: 'solid'
                });
              }

              if (p.label) {
                this.showTooltip(e, { header: p.label, rows });
              } else {
                this.showTooltip(e, {
                  header: dataset.label || `Series ${datasetIndex + 1}`,
                  rows
                });
              }
            });

            this.addElementListener(el, 'mouseleave', () => {
              this._points.forEach(pt => {
                if (pt.element) {
                  pt.element.setAttribute('opacity', fillOpacity);
                }
              });
            });
          }

          const info = {
            element: el,
            x: px,
            y: py,
            dataX: p.x,
            dataY: p.y,
            size: p.size,
            radius,
            color,
            label: p.label,
            datasetIndex,
            pointIndex
          };

          this._points.push(info);
        });
      });
    }

    /**
     * Animate points fading + scaling in
     */
    animate() {
      const duration = this.config.style.animation?.duration || 600;
      const easing = this.config.style.animation?.easing || 'easeOutCubic';

      if (!this._points || !this._points.length) return;

      this._points.forEach((pt, index) => {
        const delay = (index / this._points.length) * (duration * 0.4);

        if (pt.element) {
          pt.element.setAttribute('r', 0);
          pt.element.setAttribute('opacity', 0);
        }

        setTimeout(() => {
          this.animateValue({
            from: 0,
            to: 1,
            duration,
            easing,
            onUpdate: (progress) => {
              if (!pt.element) return;
              pt.element.setAttribute('r', pt.radius * progress);
              const scatterStyle = this.config.style.scatter || {};
              const isBubble = this._points.some(p => p.size != null);
              const targetOpacity = isBubble ? (scatterStyle.bubbleOpacity || 0.6) : (scatterStyle.pointOpacity || 0.85);
              pt.element.setAttribute('opacity', targetOpacity * progress);
            }
          });
        }, delay);
      });
    }

    /**
     * Highlight not applicable for scatter — no-op
     */
    highlightColumn() {}
    clearHighlight() {}
  }

  /**
   * NetworkBall Chart — AI Network Sphere Visualization
   *
   * A 3D rotating sphere of interconnected nodes. Multiple cursors travel
   * between nodes in parallel, lighting up connections as they go.
   */


  /** Default AI activity verbs */
  const AI_VERBS = [
    'evaluating', 'connecting', 'reasoning', 'analyzing', 'processing',
    'thinking', 'deciding', 'learning', 'classifying', 'predicting',
    'optimizing', 'synthesizing', 'inferring', 'correlating', 'mapping',
    'indexing', 'embedding', 'encoding', 'decoding', 'transforming',
    'clustering', 'scoring', 'ranking', 'resolving', 'validating'
  ];

  /**
   * Parse hex to [r,g,b]
   * @param {string} hex
   * @returns {number[]}
   */
  function parseHex(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  }

  /**
   * Unique key for a node pair (order-independent)
   * @param {number} a
   * @param {number} b
   * @returns {string}
   */
  function edgeKey(a, b) {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  class NetworkBallChart extends Chart {
    constructor(element, config = {}) {
      const merged = deepMerge(NETWORKBALL_DEFAULTS, config);
      super(element, merged);
    }

    shouldUseCanvas() {
      return true;
    }

    draw() {
      this.cancelAnimations();
      this.removeElementListeners();

      if (!this.canvas) {
        this.canvas = this.renderer.getCanvas();
        this.ctx = this.canvas.getContext('2d');
      }

      this.initNodes();
      this.initConnections();
      this.cacheColors();

      this.rotation = { x: 0.3, y: 0 };
      this.litEdges = new Map();
      this.cursors = [];
      this.litNodes = new Map();
      this._sortIndices = this.nodes.map((_, i) => i);

      this.startLoop();
    }

    render() {}

    cacheColors() {
      const cfg = this.config.style.networkball;
      this._colors = {
        node: parseHex(cfg.nodeColor),
        active: parseHex(cfg.activeColor),
        ring: parseHex(cfg.ringColor || '#c8cdd6')
      };
    }

    /**
     * Place nodes on a Fibonacci sphere
     */
    initNodes() {
      const cfg = this.config.style.networkball;
      const count = this.config.data.nodeCount || cfg.nodeCount;
      this.nodes = [];

      const goldenAngle = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2; // -1 to 1
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;

        this.nodes.push({
          // Unit sphere coordinates (static)
          sx: Math.cos(theta) * radiusAtY,
          sy: y,
          sz: Math.sin(theta) * radiusAtY,
          // Screen coordinates (updated each frame)
          x: 0, y: 0, z: 0
        });
      }
    }

    /**
     * Pre-compute connections using 3D distance on unit sphere
     */
    initConnections() {
      const cfg = this.config.style.networkball;
      const maxDist = cfg.connectionDistance;
      const maxDistSq = maxDist * maxDist;

      this.connections = [];
      this.neighbors = [];

      // Build neighbor lists
      for (let i = 0; i < this.nodes.length; i++) {
        const a = this.nodes[i];
        const nearby = [];

        for (let j = 0; j < this.nodes.length; j++) {
          if (i === j) continue;
          const b = this.nodes[j];
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const dz = a.sz - b.sz;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < maxDistSq) {
            nearby.push({ index: j, distSq });
          }
        }

        nearby.sort((a, b) => a.distSq - b.distSq);
        this.neighbors.push(nearby.map(n => n.index));
      }

      // Deduplicated connection list
      const seen = new Set();
      for (let i = 0; i < this.neighbors.length; i++) {
        for (const j of this.neighbors[i]) {
          const key = edgeKey(i, j);
          if (!seen.has(key)) {
            seen.add(key);
            this.connections.push({ from: i, to: j, key });
          }
        }
      }
    }

    startLoop() {
      if (this._loopId) cancelAnimationFrame(this._loopId);

      const cfg = this.config.style.networkball;
      let lastTime = 0;

      const loop = (time) => {
        const dt = lastTime ? (time - lastTime) / 1000 : 0.016;
        lastTime = time;

        this.updateProjection(dt, cfg);
        this.updateState(dt, cfg);
        this.renderFrame(cfg);

        this._loopId = requestAnimationFrame(loop);
      };

      this._loopId = requestAnimationFrame(loop);
    }

    /**
     * Rotate sphere and project nodes to 2D screen coordinates
     * @param {number} dt
     * @param {Object} cfg
     */
    updateProjection(dt, cfg) {
      this.rotation.y += (cfg.rotationSpeed || 0.4) * dt;

      const cx = this.width / 2;
      const cy = this.height / 2;
      const radius = Math.min(cx, cy) * cfg.sphereScale;
      const cosY = Math.cos(this.rotation.y);
      const sinY = Math.sin(this.rotation.y);
      const cosX = Math.cos(this.rotation.x);
      const sinX = Math.sin(this.rotation.x);

      for (const node of this.nodes) {
        // Rotate around Y
        const x1 = node.sx * cosY - node.sz * sinY;
        const z1 = node.sx * sinY + node.sz * cosY;
        // Rotate around X
        const y1 = node.sy * cosX - z1 * sinX;
        const z2 = node.sy * sinX + z1 * cosX;

        node.x = cx + x1 * radius;
        node.y = cy + y1 * radius;
        node.z = z2; // -1 (back) to 1 (front)
      }
    }

    /**
     * Update cursors, edge energy, node energy
     * @param {number} dt
     * @param {Object} cfg
     */
    updateState(dt, cfg) {
      const speed = cfg.travelerSpeed || 1.2;
      const decay = cfg.energyDecay || 1.5;

      // Decay lit edges
      for (const [key, energy] of this.litEdges) {
        const next = energy - dt * decay;
        if (next <= 0) {
          this.litEdges.delete(key);
        } else {
          this.litEdges.set(key, next);
        }
      }

      // Decay lit nodes
      for (const [key, val] of this.litNodes) {
        const next = val - dt * decay;
        if (next <= 0) {
          this.litNodes.delete(key);
        } else {
          this.litNodes.set(key, next);
        }
      }

      // Update cursors
      const alive = [];
      for (const cur of this.cursors) {
        cur.progress += dt * speed;

        if (cur.progress >= 1) {
          this.litNodes.set(cur.targetNode, 1);
          cur.hops++;

          if (cur.hops >= (cfg.travelerMaxHops || 5)) {
            continue;
          }

          if (this.advanceCursor(cur)) {
            alive.push(cur);
          }
        } else {
          alive.push(cur);
        }
      }

      this.cursors = alive;
    }

    /**
     * Advance cursor to next node
     * @param {Object} cur
     * @returns {boolean}
     */
    advanceCursor(cur) {
      const neighborList = this.neighbors[cur.targetNode];
      if (!neighborList || neighborList.length === 0) return false;

      let nextIdx = -1;
      for (const n of neighborList) {
        if (n !== cur.sourceNode && !cur.visited.has(n)) {
          nextIdx = n;
          break;
        }
      }

      if (nextIdx === -1) {
        for (const n of neighborList) {
          if (n !== cur.sourceNode) { nextIdx = n; break; }
        }
      }

      if (nextIdx === -1) nextIdx = neighborList[0];

      this.litEdges.set(edgeKey(cur.targetNode, nextIdx), 1);

      cur.visited.add(cur.targetNode);
      cur.sourceNode = cur.targetNode;
      cur.targetNode = nextIdx;
      cur.progress = 0;
      cur.label = this.pickVerb();
      return true;
    }

    /**
     * Render one frame
     * @param {Object} cfg
     */
    renderFrame(cfg) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      // Background
      const bg = this.config.style.background;
      if (bg && bg !== 'transparent') {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.width, this.height);
      }

      // Connections (idle + lit)
      this.drawConnections(ctx, cfg);

      // Depth-sort nodes (insertion sort, nearly sorted → O(n))
      const indices = this._sortIndices;
      const nodes = this.nodes;
      for (let i = 1; i < indices.length; i++) {
        const key = indices[i];
        const keyZ = nodes[key].z;
        let j = i - 1;
        while (j >= 0 && nodes[indices[j]].z > keyZ) {
          indices[j + 1] = indices[j];
          j--;
        }
        indices[j + 1] = key;
      }

      // Nodes (back to front)
      for (let i = 0; i < indices.length; i++) {
        this.drawNode(ctx, cfg, indices[i]);
      }

      // Cursors (on top)
      for (const cur of this.cursors) {
        this.drawCursor(ctx, cfg, cur);
      }
    }

    /**
     * Draw idle connections and lit connections in two passes
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} cfg
     */
    drawConnections(ctx, cfg) {
      const nc = this._colors.node;
      const ac = this._colors.active;
      const nodes = this.nodes;

      // Pass 1: idle
      ctx.lineWidth = cfg.connectionWidth;
      for (const conn of this.connections) {
        const a = nodes[conn.from];
        const b = nodes[conn.to];
        const avgZ = (a.z + b.z) / 2;
        const depthAlpha = 0.15 + 0.85 * ((avgZ + 1) / 2);

        ctx.globalAlpha = cfg.connectionOpacity * depthAlpha;
        ctx.strokeStyle = `rgb(${nc[0]},${nc[1]},${nc[2]})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Pass 2: lit
      for (const conn of this.connections) {
        const e = this.litEdges.get(conn.key);
        if (!e) continue;

        const a = nodes[conn.from];
        const b = nodes[conn.to];
        const avgZ = (a.z + b.z) / 2;
        const depthAlpha = 0.3 + 0.7 * ((avgZ + 1) / 2);

        ctx.strokeStyle = `rgba(${ac[0]},${ac[1]},${ac[2]},${e * 0.7 * depthAlpha})`;
        ctx.lineWidth = cfg.connectionWidth + e * 1.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    /**
     * Draw a single node with depth-based opacity/size
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} cfg
     * @param {number} index
     */
    drawNode(ctx, cfg, index) {
      const node = this.nodes[index];
      const depthFactor = (node.z + 1) / 2; // 0 back, 1 front
      const r = cfg.nodeRadius * (0.4 + 0.6 * depthFactor);
      const alpha = 0.2 + 0.8 * depthFactor;

      const nc = this._colors.node;
      const ac = this._colors.active;
      const energy = this.litNodes.get(index) || 0;

      if (energy > 0) {
        // Glow halo
        ctx.globalAlpha = energy * 0.2 * alpha;
        ctx.fillStyle = `rgb(${ac[0]},${ac[1]},${ac[2]})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + energy * cfg.glowRadius, 0, 6.2832);
        ctx.fill();

        // Core — lerp toward active color
        const cr = nc[0] + (ac[0] - nc[0]) * energy | 0;
        const cg = nc[1] + (ac[1] - nc[1]) * energy | 0;
        const cb = nc[2] + (ac[2] - nc[2]) * energy | 0;
        ctx.globalAlpha = alpha * (0.6 + energy * 0.4);
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * (1 + energy * 0.3), 0, 6.2832);
        ctx.fill();
      } else {
        ctx.globalAlpha = alpha * cfg.nodeOpacity;
        ctx.fillStyle = `rgb(${nc[0]},${nc[1]},${nc[2]})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 6.2832);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    /**
     * Draw a cursor with depth awareness
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} cfg
     * @param {Object} cur
     */
    drawCursor(ctx, cfg, cur) {
      const a = this.nodes[cur.sourceNode];
      const b = this.nodes[cur.targetNode];
      const p = cur.progress;
      const ep = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);

      const x = a.x + (b.x - a.x) * ep;
      const y = a.y + (b.y - a.y) * ep;
      const z = a.z + (b.z - a.z) * ep;

      // Keep connection lit while traveling
      this.litEdges.set(edgeKey(cur.sourceNode, cur.targetNode), 1);

      const depthFactor = (z + 1) / 2;
      const alpha = 0.3 + 0.7 * depthFactor;
      const ac = this._colors.active;
      const r = cfg.nodeRadius * (1 + 0.6 * depthFactor);

      // Outer glow
      ctx.globalAlpha = 0.12 * alpha;
      ctx.fillStyle = `rgb(${ac[0]},${ac[1]},${ac[2]})`;
      ctx.beginPath();
      ctx.arc(x, y, r + cfg.glowRadius * 0.7, 0, 6.2832);
      ctx.fill();

      // Mid glow
      ctx.globalAlpha = 0.25 * alpha;
      ctx.beginPath();
      ctx.arc(x, y, r + cfg.glowRadius * 0.25, 0, 6.2832);
      ctx.fill();

      // Core
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${ac[0]},${ac[1]},${ac[2]})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.fill();

      // White center
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.6 * alpha;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.3, 0, 6.2832);
      ctx.fill();

      // Label — only show when cursor is on the front half
      const fontSize = cfg.labelFontSize || 10;
      if (cur.label && fontSize > 0 && z > -0.1) {
        const fontFamily = this.config.style.fontFamily || 'sans-serif';
        ctx.font = `500 ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const labelY = y - r - cfg.glowRadius * 0.4 - 4;
        const text = cur.label;
        const metrics = ctx.measureText(text);
        const pw = metrics.width + 10;
        const ph = fontSize + 6;
        const px = x - pw / 2;
        const py = labelY - ph + 2;
        const pr = ph / 2;

        ctx.globalAlpha = 0.5 * depthFactor;
        ctx.fillStyle = `rgb(${ac[0]},${ac[1]},${ac[2]})`;
        ctx.beginPath();
        ctx.moveTo(px + pr, py);
        ctx.lineTo(px + pw - pr, py);
        ctx.arc(px + pw - pr, py + pr, pr, -1.5708, 1.5708);
        ctx.lineTo(px + pr, py + ph);
        ctx.arc(px + pr, py + pr, pr, 1.5708, -1.5708);
        ctx.fill();

        ctx.globalAlpha = depthFactor;
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x, labelY);
      }

      ctx.globalAlpha = 1;
    }

    /**
     * Pick a random AI verb, avoiding repeats
     * @returns {string}
     */
    pickVerb() {
      let verb;
      do {
        verb = AI_VERBS[Math.floor(Math.random() * AI_VERBS.length)];
      } while (verb === this._lastVerb);
      this._lastVerb = verb;
      return verb;
    }

    /**
     * Push an event — spawns a cursor that travels between nodes.
     * Multiple cursors run in parallel.
     *
     * @param {Object} [event] - Event configuration
     * @param {string} [event.label] - Starting label (auto-generated if omitted)
     * @param {number} [event.node] - Starting node index (random if omitted)
     * @returns {NetworkBallChart} this
     */
    pushEvent(event = {}) {
      const sourceIdx = event.node ?? Math.floor(Math.random() * this.nodes.length);
      const neighborList = this.neighbors[sourceIdx];
      if (!neighborList || neighborList.length === 0) return this;

      this.litNodes.set(sourceIdx, 1);

      const targetIdx = neighborList[Math.floor(Math.random() * Math.min(3, neighborList.length))];
      this.litEdges.set(edgeKey(sourceIdx, targetIdx), 1);

      this.cursors.push({
        sourceNode: sourceIdx,
        targetNode: targetIdx,
        progress: 0,
        hops: 0,
        label: event.label || this.pickVerb(),
        visited: new Set([sourceIdx])
      });

      return this;
    }

    /**
     * Push multiple events
     * @param {number} count
     * @param {number} [interval=200]
     * @returns {NetworkBallChart} this
     */
    burst(count = 5, interval = 200) {
      for (let i = 0; i < count; i++) {
        setTimeout(() => this.pushEvent(), i * interval);
      }
      return this;
    }

    /**
     * Start automatic events
     * @param {number} [intervalMs=2000]
     * @returns {NetworkBallChart} this
     */
    startAutoEvents(intervalMs = 2000) {
      this.stopAutoEvents();

      const fire = () => {
        this.pushEvent();
        const next = intervalMs * (0.6 + Math.random() * 0.8);
        this._autoEventTimer = setTimeout(fire, next);
      };

      fire();
      return this;
    }

    /**
     * Stop automatic events
     * @returns {NetworkBallChart} this
     */
    stopAutoEvents() {
      if (this._autoEventTimer) {
        clearTimeout(this._autoEventTimer);
        this._autoEventTimer = null;
      }
      return this;
    }

    destroy() {
      this.stopAutoEvents();
      if (this._loopId) {
        cancelAnimationFrame(this._loopId);
        this._loopId = null;
      }
      super.destroy();
    }
  }

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

  class KPICard {
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

      // Apply dark mode colors as base if theme is dark/auto
      this._dark = isDarkMode(config.theme);
      const baseColors = this._dark ? { ...KPI_DEFAULTS.colors, ...DARK_KPI_COLORS } : KPI_DEFAULTS.colors;
      this.config.colors = { ...baseColors, ...(config.colors || {}) };

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
              color: sparkline.color
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
  function createKPICard(element, config) {
    return new KPICard(element, config);
  }

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

  class TrendBadge {
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
      if (this.config.decimals > 0) {
        formatted = formatNumber(n, this.config.decimals);
      } else if (Math.abs(n) >= 1e6) {
        formatted = (n / 1e6).toFixed(1) + 'M';
      } else if (Math.abs(n) >= 1e4) {
        formatted = Math.round(n / 1e3) + 'k';
      } else if (Math.abs(n) >= 1e3) {
        formatted = (n / 1e3).toFixed(1) + 'k';
      } else {
        formatted = formatNumber(n, this.config.decimals);
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
  function createTrendBadge(element, config) {
    return new TrendBadge(element, config);
  }

  /**
   * NewChart JS - A modern charting library
   * Main entry point
   */


  /**
   * Chart factory and namespace
   */
  const NewChart = {
    /**
     * Create a new chart
     * @param {Element|string} element - DOM element or selector
     * @param {Object} config - Chart configuration
     * @returns {Chart} Chart instance
     *
     * @example
     * const chart = NewChart.create('#chart', {
     *   type: 'bar',
     *   data: {
     *     labels: ['Jan', 'Feb', 'Mar'],
     *     datasets: [{
     *       label: 'Sales',
     *       values: [100, 200, 150],
     *       color: '#4F46E5'
     *     }]
     *   }
     * });
     */
    /**
     * Global design override — merged into all charts (lower priority than user config)
     * Set via NewChart.designOverride = { style: { ... }, options: { ... } }
     * @type {Object|null}
     */
    designOverride: null,

    create(element, config = {}) {
      // Merge design override: defaults < designOverride < user config < CSS tokens
      if (NewChart.designOverride) {
        config = deepMerge(NewChart.designOverride, config);
      }

      const chartType = config.type || 'bar';

      let ChartClass;
      switch (chartType.toLowerCase()) {
        case 'bar':
          ChartClass = BarChart;
          break;
        case 'pie':
          ChartClass = PieChart;
          break;
        case 'line':
          ChartClass = LineChart;
          break;
        case 'area':
          ChartClass = AreaChart;
          break;
        case 'gauge':
          ChartClass = GaugeChart;
          break;
        case 'sparkline':
          ChartClass = SparklineChart;
          break;
        case 'combo':
          ChartClass = ComboChart;
          break;
        case 'scatter':
        case 'bubble':
          ChartClass = ScatterChart;
          break;
        case 'networkball':
          ChartClass = NetworkBallChart;
          break;
        default:
          throw new Error(`Unknown chart type: ${chartType}`);
      }

      return new ChartClass(element, config);
    },

    /**
     * Version string
     */
    version: '0.1.0',

    /**
     * Exported chart classes
     */
    BarChart,
    PieChart,
    LineChart,
    AreaChart,
    GaugeChart,
    SparklineChart,
    ComboChart,
    ScatterChart,
    NetworkBallChart,

    /**
     * KPI Card component
     */
    KPICard,

    /**
     * Create a KPI card (convenience factory)
     * @param {Element|string} element - DOM element or selector
     * @param {Object} config - Card configuration
     * @returns {KPICard} Card instance
     */
    kpiCard: createKPICard,

    /**
     * TrendBadge component
     */
    TrendBadge,

    /**
     * Create a trend badge (convenience factory)
     * @param {Element|string} element - DOM element or selector
     * @param {Object} config - Badge configuration
     * @returns {TrendBadge} Badge instance
     */
    trendBadge: createTrendBadge,

    /**
     * Get list of supported CSS custom property tokens
     * @returns {string[]} Token names
     */
    getSupportedTokens,

    /**
     * Default compare/previous-period color
     */
    COMPARE_COLOR,

    /**
     * Default color palette
     */
    PALETTE: COLOR_PALETTE,

    /**
     * Dark palette (brighter for dark backgrounds)
     */
    DARK_PALETTE: getDarkPalette(),

    /**
     * Dark theme style overrides
     */
    DARK_STYLE,

    /**
     * Dark theme KPI card colors
     */
    DARK_KPI_COLORS,

    /**
     * Check if dark mode is active for a given theme value
     * @param {string} theme - 'light', 'dark', or 'auto'
     * @returns {boolean}
     */
    isDarkMode
  };

  // DataTable not in the object literal above — attach here
  NewChart.DataTable = DataTable;

  return NewChart;

}));
//# sourceMappingURL=newchartjs.umd.js.map
