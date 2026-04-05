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
    const { data } = this.config;

    // Filter datasets by legend visibility
    const visibleDatasets = data.datasets.filter((ds, i) => this.isDatasetVisible(ds, i));

    let allValues = [];
    visibleDatasets.forEach(ds => {
      if (ds.values) {
        allValues = allValues.concat(ds.values);
      }
    });

    if (allValues.length === 0) allValues = [0];

    const { min: minValue, max: maxValue } = getMinMax(allValues);
    const valueRange = maxValue - minValue || 1;
    const scale = generateScale(minValue, maxValue, 5);

    const numPoints = data.labels?.length || 0;
    const pointSpacing = numPoints > 1 ? layout.chartWidth / (numPoints - 1) : 0;

    return {
      layout,
      visibleDatasets,
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
   * Create SVG gradient definition for area fill
   * @param {string} color - Base color
   * @param {string} id - Gradient ID
   */
  _createGradientDef(color, id) {
    if (!this.renderer.svg) return null;

    // Check if defs element exists, create if not
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
    stop1.setAttribute('stop-opacity', '0.12');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', color);
    stop2.setAttribute('stop-opacity', '0.01');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);

    return `url(#${id})`;
  }

  /**
   * Render line chart
   */
  render() {
    const { style, data, options } = this.config;
    const scales = this.calculateScales();
    const { layout, visibleDatasets, minValue, maxValue, valueRange, scale, numPoints, pointSpacing } = scales;

    const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = layout;

    const valueToY = (value) => chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
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
    this._allPoints = [];
    this._crosshairLine = null;

    visibleDatasets.forEach((dataset, datasetIndex) => {
      if (!dataset.values) return;

      const color = dataset.color || this.getPaletteColor(datasetIndex);
      const lineWidth = dataset.strokeWidth || style.line?.width || 2;
      const tension = options.smooth ? (style.line?.tension || 0.4) : 0;
      const pointRadius = options.showPoints ? (style.line?.pointRadius || 4) : 0;
      const isDashed = dataset.dash || false;

      // Prepare points
      const points = dataset.values.map((value, index) => [
        indexToX(index),
        valueToY(value)
      ]);

      // Draw area fill with gradient if enabled
      if (options.fill && !isDashed) {
        const gradientId = `area-grad-${datasetIndex}`;
        const gradientFill = this._createGradientDef(color, gradientId);

        if (gradientFill) {
          // Build closed area path
          const linePath = this.getBezierPath(points, tension);
          const lastX = points[points.length - 1][0];
          const firstX = points[0][0];
          const baseline = chartY + chartHeight;
          const areaD = `${linePath} L ${lastX},${baseline} L ${firstX},${baseline} Z`;

          this.renderer.path(areaD, {
            fill: gradientFill,
            opacity: 1
          });
        } else {
          // Canvas fallback — simple opacity fill
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
        strokeDasharray: isDashed ? (dataset.dashPattern || '5 3') : undefined,
        opacity: 1
      });

      // Draw points (hidden initially for crosshair interaction)
      const pointElements = [];
      points.forEach((point, pointIndex) => {
        if (pointRadius > 0) {
          const pointEl = this.renderer.circle(point[0], point[1], pointRadius, {
            fill: color,
            stroke: style.line?.pointBorderColor || '#ffffff',
            strokeWidth: style.line?.pointBorderWidth || 2,
            opacity: 0 // hidden by default, shown on crosshair hover
          });

          pointElements.push(pointEl);
          this._allPoints.push({
            element: pointEl,
            x: point[0],
            y: point[1],
            value: dataset.values[pointIndex],
            labelIndex: pointIndex,
            datasetIndex,
            color,
            datasetLabel: dataset.label
          });
        }
      });

      this.lines.push({
        element: lineElement,
        points,
        pointElements,
        color,
        datasetLabel: dataset.label
      });
    });

    // Create crosshair line (hidden)
    this._crosshairLine = this.renderer.line(0, chartY, 0, chartY + chartHeight, {
      stroke: '#dfe1e6',
      strokeWidth: 1,
      strokeDasharray: '3 3',
      opacity: 0
    });

    // Invisible hit areas for each x-position (crosshair columns)
    if (numPoints > 0) {
      const colWidth = pointSpacing > 0 ? pointSpacing : chartWidth;
      for (let i = 0; i < numPoints; i++) {
        const cx = indexToX(i);
        const hitX = cx - colWidth / 2;

        const hitbox = this.renderer.rect(hitX, chartY, colWidth, chartHeight, {
          fill: 'transparent',
          opacity: 0
        });

        if (hitbox) {
          hitbox.style.cursor = 'crosshair';

          this.addElementListener(hitbox, 'mouseenter', (e) => {
            // Show crosshair
            if (this._crosshairLine) {
              this._crosshairLine.setAttribute('x1', cx);
              this._crosshairLine.setAttribute('x2', cx);
              this._crosshairLine.setAttribute('opacity', '1');
            }

            // Show points at this index and build rich tooltip
            const rows = [];
            let currentValue = null;
            let prevValue = null;

            this._allPoints.forEach(pt => {
              if (pt.labelIndex === i) {
                if (pt.element) {
                  pt.element.setAttribute('opacity', '1');
                }
                const dataset = visibleDatasets[pt.datasetIndex];
                const isDashed = dataset?.dash || dataset?.ref || false;
                rows.push({
                  color: pt.color,
                  label: pt.datasetLabel || 'Value',
                  value: formatNumber(pt.value, 0),
                  style: isDashed ? 'dashed' : 'solid'
                });

                if (pt.datasetIndex === 0) currentValue = pt.value;
                if (pt.datasetIndex === 1) prevValue = pt.value;
              }
            });

            let footer = null;
            if (currentValue != null && prevValue != null && prevValue !== 0) {
              const change = ((currentValue - prevValue) / prevValue) * 100;
              const isPositive = change >= 0;
              footer = {
                label: 'YoY:',
                value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
                color: isPositive ? '#69db7c' : '#ff8787'
              };
            }

            this.showTooltip(e, {
              header: data.labels?.[i] || '',
              rows,
              footer
            });
          });

          this.addElementListener(hitbox, 'mouseleave', () => {
            // Hide crosshair
            if (this._crosshairLine) {
              this._crosshairLine.setAttribute('opacity', '0');
            }

            // Hide all points
            this._allPoints.forEach(pt => {
              if (pt.element) {
                pt.element.setAttribute('opacity', '0');
              }
            });
          });
        }
      }
    }

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
