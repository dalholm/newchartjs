/**
 * Heatmap Chart implementation
 * Grid of colored cells with X/Y labels and color scale
 */

import Chart from '../core/Chart.js';
import { HEATMAP_DEFAULTS } from '../core/defaults.js';
import { deepMerge, parseColor } from '../core/utils.js';

export class HeatmapChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(HEATMAP_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Interpolate between two colors
   * @param {string} colorLow - Low value color
   * @param {string} colorHigh - High value color
   * @param {number} t - Interpolation factor 0-1
   * @returns {string} Interpolated color
   */
  interpolateColor(colorLow, colorHigh, t) {
    const low = parseColor(colorLow);
    const high = parseColor(colorHigh);
    const r = Math.round(low.r + (high.r - low.r) * t);
    const g = Math.round(low.g + (high.g - low.g) * t);
    const b = Math.round(low.b + (high.b - low.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Render heatmap chart
   */
  render() {
    const { data, style, options } = this.config;
    if (!data.datasets?.length) return;

    const heatmap = style.heatmap || {};
    const padding = options.padding || 20;
    const topSpace = options.legend?.enabled ? 40 : 10;

    const xLabels = data.labels || [];
    const yLabels = data.yLabels || [];
    const dataset = data.datasets[0];
    const matrix = dataset.values; // 2D array [row][col]

    if (!matrix || !matrix.length) return;

    const rows = matrix.length;
    const cols = matrix[0].length;

    // Find min/max for color scale
    let minVal = Infinity, maxVal = -Infinity;
    matrix.forEach(row => row.forEach(v => {
      if (v !== null && v !== undefined) {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }));
    if (options.colorScale?.min !== undefined) minVal = options.colorScale.min;
    if (options.colorScale?.max !== undefined) maxVal = options.colorScale.max;
    const range = maxVal - minVal || 1;

    const leftSpace = padding + 70; // y-axis labels
    const bottomSpace = padding + 30; // x-axis labels
    const chartX = leftSpace;
    const chartY = topSpace + padding;
    const chartWidth = this.width - chartX - padding;
    const chartHeight = this.height - chartY - bottomSpace;

    const cellWidth = chartWidth / cols;
    const cellHeight = chartHeight / rows;
    const cellGap = heatmap.cellGap || 2;
    const cellRadius = heatmap.cellRadius || 2;

    const colorLow = heatmap.colorLow || '#e8f5e9';
    const colorMid = heatmap.colorMid || null;
    const colorHigh = heatmap.colorHigh || '#1b5e20';

    this._cellElements = [];

    // Draw cells
    matrix.forEach((row, ri) => {
      row.forEach((value, ci) => {
        if (value === null || value === undefined) return;

        const t = (value - minVal) / range;
        let color;
        if (colorMid) {
          color = t < 0.5
            ? this.interpolateColor(colorLow, colorMid, t * 2)
            : this.interpolateColor(colorMid, colorHigh, (t - 0.5) * 2);
        } else {
          color = this.interpolateColor(colorLow, colorHigh, t);
        }

        const x = chartX + ci * cellWidth + cellGap / 2;
        const y = chartY + ri * cellHeight + cellGap / 2;
        const w = cellWidth - cellGap;
        const h = cellHeight - cellGap;

        const el = this.renderer.rect(x, y, w, h, {
          fill: color,
          borderRadius: cellRadius
        });

        this._cellElements.push({ element: el, row: ri, col: ci, value });

        // Value text inside cell (if cells are big enough)
        if (w > 28 && h > 18 && heatmap.showValues !== false) {
          this.renderer.text(this.formatValue(value, options.valueDecimals || 0, 'label'), x + w / 2, y + h / 2, {
            fill: t > 0.55 ? '#ffffff' : '#374151',
            fontSize: Math.min(10, h * 0.45),
            fontFamily: style.monoFamily || style.fontFamily,
            textAnchor: 'middle',
            dominantBaseline: 'middle'
          });
        }

        // Hover
        if (el) {
          el.style.cursor = 'pointer';
          el.style.transition = 'stroke-width 0.1s ease-out';

          this.addElementListener(el, 'mouseenter', (e) => {
            el.setAttribute('stroke', style.fontColor || '#374151');
            el.setAttribute('stroke-width', '2');

            const xLabel = xLabels[ci] || `Col ${ci + 1}`;
            const yLabel = yLabels[ri] || `Row ${ri + 1}`;

            this.showTooltip(e, {
              [yLabel + ' × ' + xLabel]: this.formatValue(value, options.valueDecimals || 0, 'tooltip')
            });
          });

          this.addElementListener(el, 'mouseleave', () => {
            el.setAttribute('stroke', 'none');
            el.setAttribute('stroke-width', '0');
          });
        }
      });
    });

    // Y-axis labels (rows)
    yLabels.forEach((label, i) => {
      this.renderer.text(label, chartX - 8, chartY + i * cellHeight + cellHeight / 2, {
        fill: style.axis?.color || style.fontColor,
        fontSize: style.axis?.fontSize || 11,
        fontFamily: style.fontFamily,
        textAnchor: 'end',
        dominantBaseline: 'middle'
      });
    });

    // X-axis labels (columns)
    xLabels.forEach((label, i) => {
      this.renderer.text(label, chartX + i * cellWidth + cellWidth / 2, chartY + chartHeight + 8, {
        fill: style.axis?.color || style.fontColor,
        fontSize: style.axis?.fontSize || 11,
        fontFamily: style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'hanging'
      });
    });

    // Color scale legend
    if (heatmap.showScale !== false) {
      const scaleWidth = 120;
      const scaleHeight = 8;
      const scaleX = this.width - padding - scaleWidth;
      const scaleY2 = topSpace;

      const steps = 20;
      const stepWidth = scaleWidth / steps;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        let color;
        if (colorMid) {
          color = t < 0.5
            ? this.interpolateColor(colorLow, colorMid, t * 2)
            : this.interpolateColor(colorMid, colorHigh, (t - 0.5) * 2);
        } else {
          color = this.interpolateColor(colorLow, colorHigh, t);
        }
        this.renderer.rect(scaleX + i * stepWidth, scaleY2, stepWidth + 0.5, scaleHeight, {
          fill: color
        });
      }

      this.renderer.text(this.formatValue(minVal, null, 'axis'), scaleX, scaleY2 + scaleHeight + 4, {
        fill: style.fontColor,
        fontSize: 9,
        fontFamily: style.fontFamily,
        textAnchor: 'start',
        dominantBaseline: 'hanging'
      });
      this.renderer.text(this.formatValue(maxVal, null, 'axis'), scaleX + scaleWidth, scaleY2 + scaleHeight + 4, {
        fill: style.fontColor,
        fontSize: 9,
        fontFamily: style.fontFamily,
        textAnchor: 'end',
        dominantBaseline: 'hanging'
      });
    }
  }

  /**
   * Animate cells fading in
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    if (!this._cellElements?.length) return;

    this._cellElements.forEach(({ element, row, col }, i) => {
      if (!element) return;
      element.setAttribute('opacity', '0');
      const delay = (row + col) * 15;

      setTimeout(() => {
        element.style.transition = `opacity ${duration * 0.4}ms ease-out`;
        element.setAttribute('opacity', '1');
      }, delay);
    });
  }
}

export default HeatmapChart;
