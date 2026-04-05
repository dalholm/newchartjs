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
export function formatNumber(num, decimals = 0) {
  if (typeof num !== 'number') return String(num);
  return Number(num.toFixed(decimals)).toLocaleString();
}

/**
 * Parse CSS color to RGB values
 * @param {string} color - CSS color (hex, rgb, named)
 * @returns {Object} { r, g, b, a } object
 */
export function parseColor(color) {
  const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

  if (!ctx) {
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

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const imageData = ctx.getImageData(0, 0, 1, 1).data;

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

  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

/**
 * Generate evenly spaced scale values
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} steps - Number of steps
 * @returns {number[]} Array of scale values
 */
export function generateScale(min, max, steps = 5) {
  const scale = [];
  const step = (max - min) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    scale.push(min + step * i);
  }

  return scale;
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
