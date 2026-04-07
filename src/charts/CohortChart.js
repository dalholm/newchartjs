/**
 * Cohort Chart implementation
 * Triangular heatmap table for retention/cohort analysis
 */

import Chart from '../core/Chart.js';
import { COHORT_DEFAULTS } from '../core/defaults.js';
import { deepMerge, parseColor } from '../core/utils.js';

export class CohortChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(COHORT_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Interpolate between two colors
   */
  interpolateColor(c1, c2, t) {
    const a = parseColor(c1);
    const b = parseColor(c2);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r}, ${g}, ${bl})`;
  }

  /**
   * Render cohort chart
   */
  render() {
    const { data, style, options } = this.config;
    const dataset = data.datasets[0];
    if (!dataset?.values) return;

    const cohort = style.cohort || {};
    const padding = options.padding || 20;
    const topSpace = options.legend?.enabled ? 40 : 10;

    const matrix = dataset.values; // 2D array: [cohort][period]
    const cohortLabels = data.labels || []; // row labels (e.g., months)
    const periodLabels = data.periodLabels || []; // column headers

    const rows = matrix.length;
    const maxCols = Math.max(...matrix.map(r => r.length));

    const headerHeight = 30;
    const rowLabelWidth = 90;
    const chartX = padding + rowLabelWidth;
    const chartY = topSpace + padding + headerHeight;
    const chartWidth = this.width - chartX - padding;
    const chartHeight = this.height - chartY - padding;

    const cellWidth = Math.min(chartWidth / maxCols, 60);
    const cellHeight = Math.min(chartHeight / rows, 32);
    const cellGap = cohort.cellGap || 2;
    const cellRadius = cohort.cellRadius || 2;

    const colorLow = cohort.colorLow || '#e3f2fd';
    const colorHigh = cohort.colorHigh || '#1565c0';

    // Header labels
    for (let c = 0; c < maxCols; c++) {
      const label = periodLabels[c] || (c === 0 ? 'Size' : `M${c}`);
      this.renderer.text(label, chartX + c * cellWidth + cellWidth / 2, chartY - 10, {
        fill: style.axis?.color || style.fontColor,
        fontSize: 10,
        fontFamily: style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'auto',
        fontWeight: 600
      });
    }

    this._cellElements = [];

    matrix.forEach((row, ri) => {
      // Row label
      const rowLabel = cohortLabels[ri] || `Cohort ${ri + 1}`;
      this.renderer.text(rowLabel, chartX - 8, chartY + ri * cellHeight + cellHeight / 2, {
        fill: style.axis?.color || style.fontColor,
        fontSize: 10,
        fontFamily: style.fontFamily,
        textAnchor: 'end',
        dominantBaseline: 'middle'
      });

      row.forEach((value, ci) => {
        if (value === null || value === undefined) return;

        const x = chartX + ci * cellWidth + cellGap / 2;
        const y = chartY + ri * cellHeight + cellGap / 2;
        const w = cellWidth - cellGap;
        const h = cellHeight - cellGap;

        // First column is absolute count, rest are percentages
        const isSize = ci === 0;
        const t = isSize ? 0.3 : Math.min(value / 100, 1);
        const color = isSize
          ? (this._dark ? '#3d4350' : '#f1f3f5')
          : this.interpolateColor(colorLow, colorHigh, t);

        const el = this.renderer.rect(x, y, w, h, {
          fill: color,
          borderRadius: cellRadius
        });

        this._cellElements.push({ element: el, row: ri, col: ci, value });

        // Value text
        const displayValue = isSize
          ? this.formatValue(value, 0)
          : this.formatValue(value, 1) + '%';

        const textColor = (!isSize && t > 0.5) ? '#ffffff' : style.fontColor;

        if (w > 24) {
          this.renderer.text(displayValue, x + w / 2, y + h / 2, {
            fill: textColor,
            fontSize: Math.min(10, h * 0.45),
            fontFamily: style.monoFamily || style.fontFamily,
            textAnchor: 'middle',
            dominantBaseline: 'middle'
          });
        }

        // Hover
        if (el) {
          el.style.cursor = 'pointer';

          this.addElementListener(el, 'mouseenter', (e) => {
            el.setAttribute('stroke', style.fontColor || '#374151');
            el.setAttribute('stroke-width', '2');

            const tooltipData = {
              'Cohort': rowLabel,
              'Period': periodLabels[ci] || (ci === 0 ? 'Initial' : `Month ${ci}`),
              'Value': displayValue
            };
            this.showTooltip(e, tooltipData);
          });

          this.addElementListener(el, 'mouseleave', () => {
            el.setAttribute('stroke', 'none');
            el.setAttribute('stroke-width', '0');
          });
        }
      });
    });
  }

  /**
   * Animate cells with diagonal wave
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    if (!this._cellElements?.length) return;

    this._cellElements.forEach(({ element, row, col }) => {
      if (!element) return;
      element.setAttribute('opacity', '0');
      const delay = (row + col) * 20;

      setTimeout(() => {
        element.style.transition = `opacity ${duration * 0.3}ms ease-out`;
        element.setAttribute('opacity', '1');
      }, delay);
    });
  }
}

export default CohortChart;
