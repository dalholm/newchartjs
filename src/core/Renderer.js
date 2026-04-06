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

    if (style.rotate) {
      attrs.transform = `rotate(${style.rotate}, ${x}, ${y})`;
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
   * Draw a data point marker (circle, diamond, triangle, square, cross)
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} r - Radius
   * @param {string} shape - Shape: 'circle', 'diamond', 'triangle', 'square', 'cross'
   * @param {Object} style - Style object
   * @returns {Element} SVG element
   */
  marker(x, y, r, shape = 'circle', style = {}) {
    if (shape === 'circle' || !shape) {
      return this.circle(x, y, r, style);
    }

    let d;
    if (shape === 'diamond') {
      d = `M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;
    } else if (shape === 'triangle') {
      const h = r * 1.15;
      d = `M ${x} ${y - h} L ${x + r} ${y + h * 0.58} L ${x - r} ${y + h * 0.58} Z`;
    } else if (shape === 'square') {
      const s = r * 0.85;
      d = `M ${x - s} ${y - s} L ${x + s} ${y - s} L ${x + s} ${y + s} L ${x - s} ${y + s} Z`;
    } else if (shape === 'cross') {
      const t = r * 0.3;
      d = `M ${x - t} ${y - r} L ${x + t} ${y - r} L ${x + t} ${y - t} L ${x + r} ${y - t} L ${x + r} ${y + t} L ${x + t} ${y + t} L ${x + t} ${y + r} L ${x - t} ${y + r} L ${x - t} ${y + t} L ${x - r} ${y + t} L ${x - r} ${y - t} L ${x - t} ${y - t} Z`;
    } else {
      return this.circle(x, y, r, style);
    }

    return this.path(d, { ...style, stroke: style.stroke || 'none' });
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
   * Create a vertical gradient for bar fills (lighter top → solid bottom)
   * @param {string} color - Base color
   * @param {string} id - Unique gradient ID
   * @returns {string} Gradient fill URL
   */
  createBarGradient(color, id) {
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
    stop1.setAttribute('stop-color', '#ffffff');
    stop1.setAttribute('stop-opacity', '0.3');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#000000');
    stop2.setAttribute('stop-opacity', '0.05');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);

    return `url(#${id})`;
  }

  /**
   * Create a diagonal stripe pattern for forecast/projected bars
   * @param {string} color - Base color for the stripes
   * @param {string} id - Unique pattern ID
   * @param {number} stripeWidth - Width of each stripe in px (default 4)
   * @param {number} opacity - Opacity of the stripe overlay (default 0.3)
   * @returns {string} Pattern fill URL
   */
  createStripePattern(color, id, stripeWidth = 4, opacity = 0.3) {
    let defs = this.svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      this.svg.insertBefore(defs, this.svg.firstChild);
    }

    // Reuse existing pattern if already created
    if (defs.querySelector('#' + id)) {
      return `url(#${id})`;
    }

    const size = stripeWidth * 2;
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', id);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', size);
    pattern.setAttribute('height', size);
    pattern.setAttribute('patternTransform', 'rotate(-45)');

    // Background fill with the bar color at reduced opacity
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', size);
    bg.setAttribute('height', size);
    bg.setAttribute('fill', color);
    bg.setAttribute('opacity', opacity);

    // White stripe
    const stripe = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    stripe.setAttribute('width', stripeWidth * 0.8);
    stripe.setAttribute('height', size);
    stripe.setAttribute('fill', '#ffffff');
    stripe.setAttribute('opacity', '0.5');

    pattern.appendChild(bg);
    pattern.appendChild(stripe);
    defs.appendChild(pattern);

    return `url(#${id})`;
  }

  /**
   * Ensure a drop-shadow SVG filter exists and return its url() reference
   * @param {string} shadow - CSS-like shadow string (e.g. '0 2px 6px rgba(0,0,0,0.15)')
   * @returns {string} SVG filter URL reference
   */
  ensureShadowFilter(shadow) {
    let defs = this.svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      this.svg.insertBefore(defs, this.svg.firstChild);
    }

    const filterId = 'nc-bar-shadow';
    if (defs.querySelector('#' + filterId)) {
      return `url(#${filterId})`;
    }

    // Parse a simple shadow string: "0 2px 8px rgba(...)"
    const parts = shadow.match(/([\d.]+)\w*\s+([\d.]+)\w*\s+([\d.]+)\w*\s+(.*)/);
    const dx = parts ? parseFloat(parts[1]) : 0;
    const dy = parts ? parseFloat(parts[2]) : 2;
    const blur = parts ? parseFloat(parts[3]) : 6;
    const color = parts ? parts[4].trim() : 'rgba(0,0,0,0.15)';

    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');

    filter.innerHTML = `
      <feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${blur / 2}" flood-color="${color}" />
    `;
    defs.appendChild(filter);

    return `url(#${filterId})`;
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
   * Draw a data point marker on canvas
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} r - Radius
   * @param {string} shape - Shape
   * @param {Object} style - Style object
   */
  marker(x, y, r, shape = 'circle', style = {}) {
    if (shape === 'circle' || !shape) {
      return this.circle(x, y, r, style);
    }

    const prevAlpha = this.ctx.globalAlpha;
    if (style.opacity !== undefined) this.ctx.globalAlpha = style.opacity;

    this.ctx.beginPath();
    if (shape === 'diamond') {
      this.ctx.moveTo(x, y - r);
      this.ctx.lineTo(x + r, y);
      this.ctx.lineTo(x, y + r);
      this.ctx.lineTo(x - r, y);
    } else if (shape === 'triangle') {
      const h = r * 1.15;
      this.ctx.moveTo(x, y - h);
      this.ctx.lineTo(x + r, y + h * 0.58);
      this.ctx.lineTo(x - r, y + h * 0.58);
    } else if (shape === 'square') {
      const s = r * 0.85;
      this.ctx.moveTo(x - s, y - s);
      this.ctx.lineTo(x + s, y - s);
      this.ctx.lineTo(x + s, y + s);
      this.ctx.lineTo(x - s, y + s);
    } else if (shape === 'cross') {
      const t = r * 0.3;
      this.ctx.moveTo(x - t, y - r);
      this.ctx.lineTo(x + t, y - r);
      this.ctx.lineTo(x + t, y - t);
      this.ctx.lineTo(x + r, y - t);
      this.ctx.lineTo(x + r, y + t);
      this.ctx.lineTo(x + t, y + t);
      this.ctx.lineTo(x + t, y + r);
      this.ctx.lineTo(x - t, y + r);
      this.ctx.lineTo(x - t, y + t);
      this.ctx.lineTo(x - r, y + t);
      this.ctx.lineTo(x - r, y - t);
      this.ctx.lineTo(x - t, y - t);
    } else {
      this.ctx.globalAlpha = prevAlpha;
      return this.circle(x, y, r, style);
    }
    this.ctx.closePath();

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
    this.ctx.font = `${style.fontWeight ? style.fontWeight + ' ' : ''}${style.fontSize || 12}px ${style.fontFamily || 'sans-serif'}`;
    this.ctx.textAlign = style.textAlign || 'left';
    this.ctx.textBaseline = style.textBaseline || 'top';

    if (style.rotate) {
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate((style.rotate * Math.PI) / 180);
      this.ctx.fillText(text, 0, 0);
      this.ctx.restore();
    } else {
      this.ctx.fillText(text, x, y);
    }
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
