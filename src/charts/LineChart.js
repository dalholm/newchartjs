/**
 * Line Chart implementation
 */

import Chart from '../core/Chart.js';
import { LINE_DEFAULTS } from '../core/defaults.js';
import { getMinMax, generateScale, deepMerge, getBezierPath, getMonotonePath } from '../core/utils.js';

export class LineChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(LINE_DEFAULTS, config);
    super(element, mergedConfig);
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
          opacity: style.grid.opacity ?? 0.5,
          strokeDasharray: style.grid.dash || undefined
        });

        if (hasYAxis) {
          this.renderer.text(this.formatValue(value, 0), chartX - 10, y, {
            fill: style.axis.color,
            fontSize: style.axis.fontSize,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight || 400,
            textAnchor: 'end',
            dominantBaseline: 'middle'
          });
        }
      });
    }

    // Draw axes (respect xLine/yLine visibility)
    if (hasYAxis && style.axis.yLine !== false) {
      this.renderer.line(chartX, chartY, chartX, chartY + chartHeight, {
        stroke: style.axis.color,
        strokeWidth: style.axis.width
      });
    }

    if (hasXAxis && style.axis.xLine !== false) {
      this.renderer.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight, {
        stroke: style.axis.color,
        strokeWidth: style.axis.width
      });
    }

    // Draw lines and points
    this.lines = [];
    this._allPoints = [];
    this._crosshairLine = null;

    const pointShape = style.line?.pointShape || 'circle';

    visibleDatasets.forEach((dataset, datasetIndex) => {
      if (!dataset.values) return;

      const color = dataset.color || this.getPaletteColor(datasetIndex);
      const lineWidth = dataset.strokeWidth || style.line?.width || 2;
      const smooth = options.smooth;
      const tension = (smooth === true || smooth === 'bezier') ? (style.line?.tension || 0.4) : 0;
      const pointRadius = options.showPoints ? (style.line?.pointRadius || 4) : 0;
      const isDashed = dataset.dash || false;

      // Prepare points
      const points = dataset.values.map((value, index) => [
        indexToX(index),
        valueToY(value)
      ]);

      // Build smooth path helper
      const buildPath = (pts) => {
        if (smooth === 'monotone') return getMonotonePath(pts);
        if (tension > 0) return getBezierPath(pts, tension);
        return `M ${pts.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
      };

      // Draw area fill with gradient if enabled
      if (options.fill && !isDashed) {
        const gradientId = `area-grad-${datasetIndex}`;
        const gradientFill = this.renderer.createGradient?.(color, gradientId) || null;

        if (gradientFill) {
          // Build closed area path
          const linePath = buildPath(points);
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
          const areaPath = buildPath(areaPoints);
          this.renderer.path(areaPath, {
            fill: color,
            opacity: 0.1
          });
        }
      }

      // Draw line
      const linePath = buildPath(points);

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
          const isHollow = style.line?.pointFill === 'hollow';
          const pointEl = this.renderer.marker(point[0], point[1], pointRadius, pointShape, {
            fill: isHollow ? (style.background || '#ffffff') : color,
            stroke: isHollow ? color : (style.line?.pointBorderColor || '#ffffff'),
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
      stroke: style.grid?.color || '#dfe1e6',
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
                  value: this.formatValue(pt.value, 0),
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
              const ds0Label = rows[0]?.label || '';
              const ds1Label = rows[1]?.label || '';
              footer = {
                label: options.tooltipChangeLabel || `${ds0Label} vs ${ds1Label}:`,
                value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
                color: isPositive ? '#69db7c' : '#ff8787'
              };
            }

            this.showTooltip(e, {
              header: data.labels?.[i] || '',
              rows,
              footer
            });

            if (typeof options.onHover === 'function') {
              options.onHover(i, data.labels?.[i] || '');
            }
          });

          this.addElementListener(hitbox, 'mouseleave', () => {
            this._clearPointHighlight();

            if (typeof options.onHoverEnd === 'function') {
              options.onHoverEnd();
            }
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
   * Programmatically highlight a data point column by index
   * @param {number} index - Label index to highlight
   */
  highlightColumn(index) {
    if (!this._allPoints || !this._crosshairLine) return;

    const { data } = this.config;
    const scales = this.calculateScales();
    const { pointSpacing, layout } = scales;
    const cx = layout.chartX + index * pointSpacing;

    this._crosshairLine.setAttribute('x1', cx);
    this._crosshairLine.setAttribute('x2', cx);
    this._crosshairLine.setAttribute('opacity', '1');

    this._allPoints.forEach(pt => {
      if (pt.element) {
        pt.element.setAttribute('opacity', pt.labelIndex === index ? '1' : '0');
      }
    });
  }

  /**
   * Clear all highlights
   */
  clearHighlight() {
    this._clearPointHighlight();
  }

  /**
   * Internal: reset crosshair and points
   */
  _clearPointHighlight() {
    if (this._crosshairLine) {
      this._crosshairLine.setAttribute('opacity', '0');
    }
    if (this._allPoints) {
      this._allPoints.forEach(pt => {
        if (pt.element) {
          pt.element.setAttribute('opacity', '0');
        }
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
