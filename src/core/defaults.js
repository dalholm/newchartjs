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
export const LINE_DEFAULTS = {
  ...DEFAULT_CONFIG,
  type: 'line',
  style: {
    ...DEFAULT_CONFIG.style,
    line: {
      width: 2,
      tension: 0.4, // Bezier curve tension (0-1)
      pointRadius: 4,
      pointBorderWidth: 2,
      pointBorderColor: '#ffffff'
    }
  },
  options: {
    ...DEFAULT_CONFIG.options,
    smooth: true,
    fill: false, // Fill area under line
    showPoints: true,
    axis: {
      x: { enabled: true, label: '' },
      y: { enabled: true, label: '' }
    }
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
