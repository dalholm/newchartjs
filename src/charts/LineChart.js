/**
 * Line Chart implementation
 */

import Chart from '../core/Chart.js';
import { LINE_DEFAULTS } from '../core/defaults.js';
import { getMinMax, generateScale, formatNumber, deepMerge, lerp } from '../core/utils.js';

export class LineChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(LINE_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Calculate layout and scales
   */
  calculateLayout() {
    const padding = this.config.options.padding || 20;
    const hasXAxis = this.config.options.axis?.x?.enabled !== false;
    const hasYAxis = this.config.options.axis?.y?.enabled !== false;

    const topSpace = this.config.options.legend?.enabled ? 40 : 0;
    const bottomSpace = hasXAxis ? 40 : padding;
    const leftSpace = hasYAxis ? 60 : padding;
    const rightSpace = padding;

    const chartWidth = this.width - leftSpace - rightSpace;
    const chartHeight = this.height - topSpace - bottomSpace - padding;

    return {
      padding,
      chartX: leftSpace,
      chartY: topSpace,
      chartWidth,
      chartHeight,
      leftSpace,
      rightSpace,
      topSpace,
      bottomSpace,
      hasXAxis,
      hasYAxis
    };
  }

  /**
   * Calculate coordinate transformations
   */
  calculateScales() {
    const layout = this.calculateLayout();
    const { data, options } = this.config;

    let allValues = [];
    data.datasets.forEach(ds => {
      if (ds.values) {
        allValues = allValues.concat(ds.values);
      }
    });

    const { min: minValue, max: maxValue } = getMinMax(allValues);
    const valueRange = maxValue - minValue || 1;
    const scale = generateScale(minValue, maxValue, 5);

    const numPoints = data.labels?.length || 0;
    const pointSpacing = numPoints > 1 ? layout.chartWidth / (numPoints - 1) : 0;

    return {
      layout,
      minValue,
      maxValue,
      valueRange,
      scale,
      numPoints,
      pointSpacing
    };
  }

  /**
   * Bezier curve interpolation
   */
  getBezierPath(points, tension = 0.4) {
    if (points.length < 2) return '';

    const path = [];
    path.push(`M ${points[0][0]} ${points[0][1]}`);

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
   * Render line chart
   */
  render() {
    const { style, data, options } = this.config;
    const scales = this.calculateScales();
    const { layout, minValue, maxValue, valueRange, scale, numPoints, pointSpacing } = scales;

    const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = layout;

    // Helper to convert data value to Y coordinate
    const valueToY = (value) => chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    // Helper to convert X index to X coordinate
    const indexToX = (index) => chartX + index * pointSpacing;

    // Draw grid
    if (style.grid?.color) {
      scale.forEach((value) => {
        const y = valueToY(value);
        this.renderer.line(chartX, y, chartX + chartWidth, y, {
          stroke: style.grid.color,
          strokeWidth: style.grid.width || 1,
          opacity: 0.5
        });

        if (hasYAxis) {
          this.renderer.text(formatNumber(value, 0), chartX - 10, y, {
            fill: style.axis.color,
            fontSize: style.axis.fontSize,
            fontFamily: style.fontFamily,
            textAnchor: 'end',
            dominantBaseline: 'middle'
          });
        }
      });
    }

    // Draw axes
    if (hasYAxis) {
      this.renderer.line(chartX, chartY, chartX, chartY + chartHeight, {
        stroke: style.axis.color,
        strokeWidth: style.axis.width
      });
    }

    if (hasXAxis) {
      this.renderer.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight, {
        stroke: style.axis.color,
        strokeWidth: style.axis.width
      });
    }

    // Draw lines and points
    this.lines = [];

    data.datasets.forEach((dataset, datasetIndex) => {
      if (!dataset.values) return;

      const color = dataset.color || this.getPaletteColor(datasetIndex);
      const lineWidth = style.line?.width || 2;
      const tension = options.smooth ? (style.line?.tension || 0.4) : 0;
      const pointRadius = options.showPoints ? (style.line?.pointRadius || 4) : 0;

      // Prepare points
      const points = dataset.values.map((value, index) => [
        indexToX(index),
        valueToY(value)
      ]);

      // Draw area fill if enabled
      if (options.fill) {
        const areaPoints = [
          ...points,
          [indexToX(points.length - 1), chartY + chartHeight],
          [indexToX(0), chartY + chartHeight]
        ];

        const areaPath = this.getBezierPath(areaPoints, tension);
        this.renderer.path(areaPath, {
          fill: color,
          opacity: 0.1
        });
      }

      // Draw line
      let linePath;
      if (tension > 0) {
        linePath = this.getBezierPath(points, tension);
      } else {
        linePath = `M ${points.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
      }

      const lineElement = this.renderer.path(linePath, {
        stroke: color,
        strokeWidth: lineWidth,
        opacity: 0.85
      });

      // Draw points
      const pointElements = [];
      points.forEach((point, pointIndex) => {
        const pointEl = this.renderer.circle(point[0], point[1], pointRadius, {
          fill: color,
          stroke: style.line?.pointBorderColor || '#ffffff',
          strokeWidth: style.line?.pointBorderWidth || 2,
          opacity: 0.85
        });

        if (pointEl) {
          pointEl.style.cursor = 'pointer';
          this.addElementListener(pointEl, 'mouseenter', (e) => {
            pointEl.setAttribute('opacity', '1');
            this.showTooltip(e, {
              [dataset.label || 'Value']: formatNumber(dataset.values[pointIndex], 2),
              [data.labels?.[pointIndex] || `Point ${pointIndex}`]: ''
            });
          });

          this.addElementListener(pointEl, 'mouseleave', () => {
            pointEl.setAttribute('opacity', '0.85');
          });
        }

        pointElements.push(pointEl);
      });

      this.lines.push({
        element: lineElement,
        points,
        pointElements,
        color,
        datasetLabel: dataset.label
      });
    });

    // Draw X axis labels
    if (hasXAxis) {
      data.labels?.forEach((label, index) => {
        this.renderer.text(label, indexToX(index), chartY + chartHeight + 15, {
          fill: style.axis.color,
          fontSize: style.axis.fontSize,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'top'
        });
      });
    }
  }

  /**
   * Animate line drawing
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    const easing = this.config.style.animation?.easing || 'easeOutCubic';

    if (!this.lines || !this.lines.length) return;

    this.lines.forEach((line) => {
      this.animateValue({
        from: 0,
        to: 1,
        duration: duration,
        easing: easing,
        onUpdate: (progress) => {
          if (!line.element) return;

          const pathEl = line.element;
          const totalLength = pathEl.getTotalLength?.() || 0;

          if (totalLength > 0) {
            pathEl.style.strokeDasharray = totalLength;
            pathEl.style.strokeDashoffset = totalLength * (1 - progress);
          }
        }
      });
    });
  }
}

export default LineChart;
