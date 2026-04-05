/**
 * Renderer base class and implementations for SVG and Canvas
 */

import { createElement, getPixelRatio } from './utils.js';

/**
 * Base Renderer class
 */
export class Renderer {
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
export class SVGRenderer extends Renderer {
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
    const rect = this.createElement('rect', {
      x: x,
      y: y,
      width: width,
      height: height,
      rx: style.borderRadius || 0,
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
    const textEl = this.createElement('text', {
      x: x,
      y: y,
      fill: style.fill || '#000',
      'font-family': style.fontFamily || 'sans-serif',
      'font-size': style.fontSize || 12,
      'text-anchor': style.textAnchor || 'start',
      'dominant-baseline': style.dominantBaseline || 'hanging',
      opacity: style.opacity !== undefined ? style.opacity : 1
    });

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
export class CanvasRenderer extends Renderer {
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
    this.canvas.style.height = 'auto';

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
    const radius = style.borderRadius || 0;

    if (radius > 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height - radius);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.ctx.lineTo(x + radius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
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

export default { Renderer, SVGRenderer, CanvasRenderer };
