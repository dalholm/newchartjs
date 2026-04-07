/**
 * Utility functions for the charting library
 */

/**
 * Merge two objects deeply
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
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
export function formatNumber(num, decimals = 0, locale) {
  if (typeof num !== 'number') return String(num);
  return Number(num.toFixed(decimals)).toLocaleString(locale || undefined);
}

/**
 * Estimate the pixel width of a formatted number string
 * @param {string} text - Formatted text
 * @param {number} fontSize - Font size in pixels
 * @returns {number} Estimated width in pixels
 */
export function estimateTextWidth(text, fontSize = 12) {
  // Average character width is ~0.6 of font size for monospace-like digits
  // Commas/dots/spaces are narrower (~0.35)
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ',' || ch === '.' || ch === ' ' || ch === '\u00A0') {
      width += fontSize * 0.35;
    } else {
      width += fontSize * 0.6;
    }
  }
  return Math.ceil(width);
}

/**
 * Parse CSS color to RGB values
 * @param {string} color - CSS color (hex, rgb, named)
 * @returns {Object} { r, g, b, a } object
 */
let _parseColorCtx = null;

export function parseColor(color) {
  if (!_parseColorCtx) {
    _parseColorCtx = typeof document !== 'undefined'
      ? document.createElement('canvas').getContext('2d')
      : null;
  }

  if (!_parseColorCtx) {
    // Fallback for non-browser environments
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
        a: 1
      };
    }
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  _parseColorCtx.clearRect(0, 0, 1, 1);
  _parseColorCtx.fillStyle = color;
  _parseColorCtx.fillRect(0, 0, 1, 1);
  const imageData = _parseColorCtx.getImageData(0, 0, 1, 1).data;

  return {
    r: imageData[0],
    g: imageData[1],
    b: imageData[2],
    a: imageData[3] / 255
  };
}

/**
 * Convert RGB to hex color
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Lighten a color
 * @param {string} color - CSS color
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} Lightened color in hex
 */
export function lightenColor(color, percent) {
  const { r, g, b } = parseColor(color);
  const factor = 1 + percent / 100;

  return rgbToHex(
    Math.min(255, Math.round(r * factor)),
    Math.min(255, Math.round(g * factor)),
    Math.min(255, Math.round(b * factor))
  );
}

/**
 * Darken a color
 * @param {string} color - CSS color
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string} Darkened color in hex
 */
export function darkenColor(color, percent) {
  const { r, g, b } = parseColor(color);
  const factor = 1 - percent / 100;

  return rgbToHex(
    Math.round(r * factor),
    Math.round(g * factor),
    Math.round(b * factor)
  );
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
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
export function createElement(tag, attrs = {}, ns = null) {
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
export function getMinMax(values) {
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
export function generateScale(min, max, steps = 5) {
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
export function getBezierPath(points, tension = 0.4) {
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
export function getMonotonePath(points) {
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
 * Linear interpolation
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Progress (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get cursor position relative to an element
 * @param {MouseEvent} event - Mouse event
 * @param {Element} element - Reference element
 * @returns {Object} { x, y } position
 */
export function getCursorPosition(event, element) {
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
export function getPixelRatio() {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
}

/**
 * Check if value is a number
 * @param {*} value - Value to check
 * @returns {boolean} True if number
 */
export function isNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Get a property from nested object with dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Property path (e.g., 'a.b.c')
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Property value or default
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) return defaultValue;
  }

  return result;
}
