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

  return trimmed;
}

/**
 * Read CSS custom properties from an element and return a partial config object
 * @param {Element} element - DOM element to read computed styles from
 * @returns {Object} Partial config with resolved token values
 */
export function resolveCSSTokens(element) {
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
export function getSupportedTokens() {
  const tokens = TOKEN_MAP.map(({ token }) => token);

  for (let i = 1; i <= PALETTE_SIZE; i++) {
    tokens.push(`--nc-palette-${i}`);
  }

  return tokens;
}

export default { resolveCSSTokens, getSupportedTokens };
