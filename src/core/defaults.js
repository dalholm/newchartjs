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
export const COMPARE_COLOR = '#b3bac5';

/**
 * Default configuration for all charts
 */
export const DEFAULT_CONFIG = {
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
    fontWeight: 400,
    grid: {
      color: '#E5E7EB',
      width: 1,
      dash: null, // null = solid, string e.g. '4 2' for dashed
      opacity: 0.5
    },
    axis: {
      color: '#374151',
      width: 1,
      fontSize: 12,
      xLine: true,  // show X axis line
      yLine: true   // show Y axis line
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
      marker: { size: 10, height: 3, shape: 'bar' } // shape: 'bar', 'circle', 'square', 'line'
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
export const BAR_DEFAULTS = {
  ...DEFAULT_CONFIG,
  type: 'bar',
  style: {
    ...DEFAULT_CONFIG.style,
    bar: {
      borderRadius: 4,
      gap: 0.2, // Gap between bars as fraction of bar width
      groupGap: 0.5, // Gap between groups as fraction of bar width
      gradient: false, // vertical gradient overlay on bars
      shadow: null // drop shadow string e.g. '0 2px 6px rgba(0,0,0,0.15)'
    },
    forecast: {
      stripeWidth: 4, // diagonal stripe width in px
      opacity: 0.35, // opacity of forecast bar overlay
      borderDash: '3 2' // dashed border around forecast portion
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
export const PIE_DEFAULTS = {
  ...DEFAULT_CONFIG,
  type: 'pie',
  style: {
    ...DEFAULT_CONFIG.style,
    pie: {
      startAngle: -Math.PI / 2,
      endAngle: Math.PI * 1.5,
      innerRadius: 0, // 0 for pie, > 0 for donut
      borderWidth: 2,
      borderColor: '#ffffff',
      padAngle: 0 // radians of spacing between slices (e.g. 0.02)
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
export const LINE_DEFAULTS = {
  ...DEFAULT_CONFIG,
  type: 'line',
  style: {
    ...DEFAULT_CONFIG.style,
    line: {
      width: 2,
      tension: 0.4, // Bezier curve tension (only used when smooth: 'bezier')
      pointRadius: 4,
      pointBorderWidth: 2,
      pointBorderColor: '#ffffff',
      pointFill: 'solid', // 'solid' or 'hollow'
      pointShape: 'circle' // 'circle', 'diamond', 'triangle', 'square', 'cross'
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
export const AREA_DEFAULTS = {
  ...DEFAULT_CONFIG,
  type: 'area',
  style: {
    ...DEFAULT_CONFIG.style,
    line: {
      width: 2,
      tension: 0.4,
      pointRadius: 4,
      pointBorderWidth: 2,
      pointBorderColor: '#ffffff',
      pointFill: 'solid',
      pointShape: 'circle'
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
export const GAUGE_DEFAULTS = {
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
export const SPARKLINE_DEFAULTS = {
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
export const COMBO_DEFAULTS = {
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
    },
    forecast: {
      stripeWidth: 4,
      opacity: 0.35,
      borderDash: '3 2'
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
export const SCATTER_DEFAULTS = {
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
export const DARK_STYLE = {
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
export const DARK_KPI_COLORS = {
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
 * Dark theme colors for Legend component
 */
export const DARK_LEGEND_COLORS = {
  color: '#e0e2e7',
  border: '#2d3139',
  borderDisabled: '#252830',
  background: '#1a1d23',
  backgroundDisabled: '#1e2028',
  textDisabled: '#6b7280'
};

/**
 * Dark theme colors for DataTable component
 */
export const DARK_TABLE_COLORS = {
  border: '#2d3139',
  headerBg: '#1e2028',
  headerColor: '#8993a4',
  headerBorder: '#3d4350',
  rowEven: '#1a1d23',
  rowOdd: '#1e2028',
  rowBorder: '#2d3139',
  rowHover: 'rgba(92, 124, 250, 0.1)',
  cellLabel: '#e0e2e7',
  cellValue: '#a1a7b3'
};

/**
 * Detect whether dark mode should be active
 * @param {string} theme - 'light', 'dark', or 'auto'
 * @returns {boolean} True if dark mode should be used
 */
export function isDarkMode(theme) {
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
export function getDarkPalette() {
  return DARK_PALETTE;
}

/**
 * Default configuration for NetworkBall charts
 */
export const NETWORKBALL_DEFAULTS = {
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
export const COLOR_PALETTE = PALETTE;

/**
 * Get a color from the palette by index
 * @param {number} index - Index in palette
 * @returns {string} Color hex value
 */
export function getPaletteColor(index) {
  return PALETTE[index % PALETTE.length];
}

/**
 * Get colors for multiple datasets
 * @param {number} count - Number of colors needed
 * @returns {string[]} Array of colors
 */
export function getColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(getPaletteColor(i));
  }
  return colors;
}
