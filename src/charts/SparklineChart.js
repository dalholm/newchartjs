/**
 * Sparkline Chart implementation
 * Tiny inline chart without axes, legend, or tooltip — designed for KPI cards and table cells
 * Supports line, bar, and area variants
 */

import Chart from '../core/Chart.js';
import { SPARKLINE_DEFAULTS } from '../core/defaults.js';
import { getMinMax, deepMerge } from '../core/utils.js';

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
   * Bezier curve interpolation for smooth sparklines
   * @param {Array} points - [x, y] coordinate pairs
   * @param {number} tension - Curve tension (0-1)
   * @returns {string} SVG path data
   */
  getBezierPath(points, tension = 0.3) {
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
   * Create gradient for area fill
   * @param {string} color - Base color
   * @param {string} id - Gradient ID
   * @returns {string|null} Gradient URL
   */
  _createGradientDef(color, id) {
    if (!this.renderer.svg) return null;

    let defs = this.renderer.svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      this.renderer.svg.insertBefore(defs, this.renderer.svg.firstChild);
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
    stop1.setAttribute('stop-opacity', '0.2');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', color);
    stop2.setAttribute('stop-opacity', '0.02');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);

    return `url(#${id})`;
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
        stroke: '#ffffff',
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
    const tension = options.smooth !== false ? (style.sparkline?.tension ?? 0.3) : 0;

    const points = values.map((v, i) => [
      padX + (i / (values.length - 1)) * w,
      padY + h - ((v - min) / range) * h
    ]);

    // Area fill
    if (isArea) {
      const gradientId = 'spark-area-0';
      const gradientFill = this._createGradientDef(color, gradientId);
      const baseline = padY + h;

      if (gradientFill) {
        const linePath = this.getBezierPath(points, tension);
        const areaD = `${linePath} L ${points[points.length - 1][0]},${baseline} L ${points[0][0]},${baseline} Z`;
        this.renderer.path(areaD, { fill: gradientFill });
      } else {
        const areaPoints = [...points, [points[points.length - 1][0], baseline], [points[0][0], baseline]];
        const areaPath = `M ${areaPoints.map(p => `${p[0]} ${p[1]}`).join(' L ')} Z`;
        this.renderer.path(areaPath, { fill: color, opacity: 0.1 });
      }
    }

    // Line
    let linePath;
    if (tension > 0) {
      linePath = this.getBezierPath(points, tension);
    } else {
      linePath = `M ${points.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
    }

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
