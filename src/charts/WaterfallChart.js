/**
 * Waterfall Chart implementation
 * Bridge/waterfall chart showing running totals with positive/negative deltas
 */

import Chart from '../core/Chart.js';
import { WATERFALL_DEFAULTS } from '../core/defaults.js';
import { formatNumber, deepMerge } from '../core/utils.js';

export class WaterfallChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(WATERFALL_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Render waterfall chart
   */
  render() {
    const { data, style, options } = this.config;
    const dataset = data.datasets[0];
    if (!dataset || !dataset.values) return;

    const layout = this.calculateLayout();
    const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = layout;
    const values = dataset.values;
    const labels = data.labels || [];
    const types = dataset.types || []; // 'increase', 'decrease', 'total'
    const waterfall = style.waterfall || {};

    // Calculate running totals
    const bars = [];
    let runningTotal = 0;

    values.forEach((value, i) => {
      const type = types[i] || (value >= 0 ? 'increase' : 'decrease');

      if (type === 'total') {
        bars.push({
          index: i,
          value: runningTotal,
          start: 0,
          end: runningTotal,
          type: 'total',
          label: labels[i] || `Item ${i + 1}`,
          delta: runningTotal
        });
      } else {
        const start = runningTotal;
        runningTotal += value;
        bars.push({
          index: i,
          value,
          start: Math.min(start, runningTotal),
          end: Math.max(start, runningTotal),
          type: value >= 0 ? 'increase' : 'decrease',
          label: labels[i] || `Item ${i + 1}`,
          delta: value,
          runningStart: start,
          runningEnd: runningTotal
        });
      }
    });

    // Calculate scale
    const allValues = bars.flatMap(b => [b.start, b.end]);
    let minVal = Math.min(0, ...allValues);
    let maxVal = Math.max(0, ...allValues);
    const range = maxVal - minVal || 1;
    minVal -= range * 0.05;
    maxVal += range * 0.05;

    const barWidth = (chartWidth / bars.length) * 0.6;
    const barSpacing = chartWidth / bars.length;

    const scaleY = (val) => chartY + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;

    // Draw grid lines
    const gridCount = 5;
    for (let i = 0; i <= gridCount; i++) {
      const val = minVal + (maxVal - minVal) * (i / gridCount);
      const y = scaleY(val);

      this.renderer.line(chartX, y, chartX + chartWidth, y, {
        stroke: style.grid?.color || '#E5E7EB',
        strokeWidth: style.grid?.width || 1,
        opacity: style.grid?.opacity || 0.5
      });

      if (hasYAxis) {
        this.renderer.text(formatNumber(val, 0), chartX - 8, y, {
          fill: style.axis?.color || style.fontColor,
          fontSize: style.axis?.fontSize || 11,
          fontFamily: style.fontFamily,
          textAnchor: 'end',
          dominantBaseline: 'middle'
        });
      }
    }

    // Zero line
    const zeroY = scaleY(0);
    this.renderer.line(chartX, zeroY, chartX + chartWidth, zeroY, {
      stroke: style.axis?.color || '#374151',
      strokeWidth: 1
    });

    // Colors
    const increaseColor = waterfall.increaseColor || '#0ca678';
    const decreaseColor = waterfall.decreaseColor || '#e03131';
    const totalColor = waterfall.totalColor || '#4c6ef5';
    const connectorColor = waterfall.connectorColor || '#9ca3af';

    this._barElements = [];

    bars.forEach((bar, i) => {
      const x = chartX + i * barSpacing + (barSpacing - barWidth) / 2;
      const barTop = scaleY(bar.end);
      const barBottom = scaleY(bar.start);
      const barHeight = Math.max(barBottom - barTop, 1);

      const color = bar.type === 'total' ? totalColor
        : bar.type === 'increase' ? increaseColor
        : decreaseColor;

      const borderRadius = (style.bar?.borderRadius || 3);

      const el = this.renderer.rect(x, barTop, barWidth, barHeight, {
        fill: color,
        borderRadius,
        borderRadiusTop: true
      });

      this._barElements.push({ element: el, bar });

      // Connector line to next bar
      if (i < bars.length - 1 && bar.type !== 'total') {
        const nextBar = bars[i + 1];
        const connectorY = scaleY(bar.type === 'total' ? bar.end : (bar.runningEnd !== undefined ? bar.runningEnd : bar.end));
        const nextX = chartX + (i + 1) * barSpacing + (barSpacing - barWidth) / 2;

        this.renderer.line(x + barWidth, connectorY, nextX, connectorY, {
          stroke: connectorColor,
          strokeWidth: 1,
          strokeDasharray: '3 2'
        });
      }

      // Value label on top of bar
      const labelY = barTop - 6;
      const prefix = bar.type !== 'total' && bar.delta >= 0 ? '+' : '';
      this.renderer.text(
        prefix + formatNumber(bar.type === 'total' ? bar.end : bar.delta, 0),
        x + barWidth / 2,
        labelY,
        {
          fill: color,
          fontSize: 10,
          fontFamily: style.monoFamily || style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'auto',
          fontWeight: bar.type === 'total' ? 700 : 400
        }
      );

      // X-axis label
      if (hasXAxis) {
        this.renderer.text(bar.label, x + barWidth / 2, chartY + chartHeight + 8, {
          fill: style.axis?.color || style.fontColor,
          fontSize: style.axis?.fontSize || 11,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'hanging',
          fontWeight: bar.type === 'total' ? 600 : 400
        });
      }

      // Hover interaction
      if (el) {
        el.style.cursor = 'pointer';
        el.style.transition = 'filter 0.15s ease-out';

        this.addElementListener(el, 'mouseenter', (e) => {
          el.style.filter = 'brightness(1.1)';
          this._barElements.forEach(({ element: other }) => {
            if (other !== el) other.setAttribute('opacity', '0.4');
          });

          const tooltipData = { [bar.label]: formatNumber(bar.type === 'total' ? bar.end : bar.delta, 0) };
          if (bar.type !== 'total') {
            tooltipData['Running total'] = formatNumber(bar.runningEnd, 0);
          }
          tooltipData['Type'] = bar.type;
          this.showTooltip(e, tooltipData);
        });

        this.addElementListener(el, 'mouseleave', () => {
          el.style.filter = '';
          this._barElements.forEach(({ element: other }) => {
            other.setAttribute('opacity', '1');
          });
        });
      }
    });

    this.bars = bars;
  }

  /**
   * Animate bars growing from zero
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    if (!this._barElements?.length) return;

    this._barElements.forEach(({ element }, i) => {
      if (!element) return;
      element.style.opacity = '0';
      element.style.transform = 'scaleY(0)';
      element.style.transformOrigin = 'bottom';
      element.style.transition = `opacity ${duration * 0.5}ms ease-out, transform ${duration}ms cubic-bezier(0.34, 1.2, 0.64, 1)`;

      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'scaleY(1)';
      }, i * 40);
    });
  }
}

export default WaterfallChart;
