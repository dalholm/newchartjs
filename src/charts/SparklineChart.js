/**
 * Sparkline Chart implementation
 * Tiny inline chart without axes, legend, or tooltip — designed for KPI cards and table cells
 * Supports line, bar, and area variants
 */

import Chart from '../core/Chart.js';
import { SPARKLINE_DEFAULTS } from '../core/defaults.js';
import { getMinMax, deepMerge, getBezierPath, getMonotonePath } from '../core/utils.js';

export class SparklineChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(SPARKLINE_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Override dimension calculation for sparklines — allow smaller sizes
   */
  updateDimensions() {
    const rect = this.element.getBoundingClientRect();
    this.width = rect.width || 120;
    this.height = rect.height || 32;

    if (this.renderer) {
      this.renderer.width = this.width;
      this.renderer.height = this.height;
    }
  }

  /**
   * Render sparkline
   */
  render() {
    const { style, data, options } = this.config;
    const dataset = data.datasets?.[0];
    if (!dataset?.values?.length) return;

    const values = dataset.values;
    const variant = options.variant || 'line';
    const color = dataset.color || style.sparkline?.color || this.getPaletteColor(0);
    const padX = style.sparkline?.paddingX ?? 2;
    const padY = style.sparkline?.paddingY ?? 4;

    const w = this.width - padX * 2;
    const h = this.height - padY * 2;

    const { min: dataMin, max: dataMax } = getMinMax(values);
    const min = options.min ?? dataMin;
    const max = options.max ?? dataMax;
    const range = max - min || 1;

    if (variant === 'bar') {
      this._renderBars(values, color, w, h, padX, padY, min, range);
    } else {
      this._renderLine(values, color, w, h, padX, padY, min, range, variant === 'area');
    }

    // Highlight last point
    if (options.highlightLast !== false && variant !== 'bar') {
      const lastIndex = values.length - 1;
      const lastX = padX + (lastIndex / (values.length - 1)) * w;
      const lastY = padY + h - ((values[lastIndex] - min) / range) * h;
      const dotRadius = style.sparkline?.dotRadius ?? 2.5;

      this.renderer.circle(lastX, lastY, dotRadius, {
        fill: color,
        stroke: style.background || '#ffffff',
        strokeWidth: 1.5
      });
    }

    // Reference line (e.g., zero line or target)
    if (options.referenceLine != null) {
      const refY = padY + h - ((options.referenceLine - min) / range) * h;
      this.renderer.line(padX, refY, padX + w, refY, {
        stroke: style.sparkline?.referenceColor || '#b3bac5',
        strokeWidth: 1,
        strokeDasharray: '3 2'
      });
    }
  }

  /**
   * Render line/area variant
   */
  _renderLine(values, color, w, h, padX, padY, min, range, isArea) {
    const { style, options } = this.config;
    const smooth = options.smooth;
    const tension = (smooth === true || smooth === 'bezier') ? (style.sparkline?.tension ?? 0.3) : 0;

    const buildPath = (pts) => {
      if (smooth === 'monotone') return getMonotonePath(pts);
      if (tension > 0) return getBezierPath(pts, tension);
      return `M ${pts.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
    };

    const points = values.map((v, i) => [
      padX + (i / (values.length - 1)) * w,
      padY + h - ((v - min) / range) * h
    ]);

    // Area fill
    if (isArea) {
      const gradientId = 'spark-area-0';
      const gradientFill = this.renderer.createGradient?.(color, gradientId, 0.2, 0.02) || null;
      const baseline = padY + h;

      if (gradientFill) {
        const linePath = buildPath(points);
        const areaD = `${linePath} L ${points[points.length - 1][0]},${baseline} L ${points[0][0]},${baseline} Z`;
        this.renderer.path(areaD, { fill: gradientFill });
      } else {
        const areaPoints = [...points, [points[points.length - 1][0], baseline], [points[0][0], baseline]];
        const areaPath = `M ${areaPoints.map(p => `${p[0]} ${p[1]}`).join(' L ')} Z`;
        this.renderer.path(areaPath, { fill: color, opacity: 0.1 });
      }
    }

    // Line
    const linePath = buildPath(points);

    this.renderer.path(linePath, {
      stroke: color,
      strokeWidth: style.sparkline?.lineWidth ?? 1.5,
      opacity: 1
    });
  }

  /**
   * Render bar variant
   */
  _renderBars(values, color, w, h, padX, padY, min, range) {
    const { style, options } = this.config;
    const gap = style.sparkline?.barGap ?? 1;
    const barWidth = (w - gap * (values.length - 1)) / values.length;
    const radius = style.sparkline?.barRadius ?? 1;
    const negativeColor = style.sparkline?.negativeColor || '#e03131';

    values.forEach((v, i) => {
      const x = padX + i * (barWidth + gap);
      const barH = ((v - min) / range) * h;
      const y = padY + h - barH;

      this.renderer.rect(x, y, Math.max(barWidth, 1), barH, {
        fill: v >= 0 ? color : negativeColor,
        borderRadius: radius
      });
    });
  }

  /**
   * Animate sparkline drawing
   */
  animate() {
    // Sparklines animate via line reveal
    const duration = this.config.style.animation?.duration || 400;
    const easing = this.config.style.animation?.easing || 'easeOutCubic';

    const pathEls = this.renderer.svg?.querySelectorAll('path[stroke]');
    if (!pathEls) return;

    pathEls.forEach(pathEl => {
      const totalLength = pathEl.getTotalLength?.() || 0;
      if (totalLength > 0) {
        this.animateValue({
          from: 0, to: 1, duration, easing,
          onUpdate: (progress) => {
            pathEl.style.strokeDasharray = totalLength;
            pathEl.style.strokeDashoffset = totalLength * (1 - progress);
          }
        });
      }
    });
  }
}

export default SparklineChart;
