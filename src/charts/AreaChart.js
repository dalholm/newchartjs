/**
 * Area Chart implementation
 * Extends LineChart with gradient fill enabled by default
 */

import Chart from '../core/Chart.js';
import { AREA_DEFAULTS } from '../core/defaults.js';
import { getMinMax, generateScale, formatNumber, deepMerge, getBezierPath, getMonotonePath } from '../core/utils.js';

export class AreaChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(AREA_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Calculate coordinate transformations
   */
  calculateScales() {
    const layout = this.calculateLayout();
    const { data } = this.config;

    const visibleDatasets = data.datasets.filter((ds, i) => this.isDatasetVisible(ds, i));

    let allValues = [];
    visibleDatasets.forEach(ds => {
      if (ds.values) allValues = allValues.concat(ds.values);
    });
    if (allValues.length === 0) allValues = [0];

    const { min: minValue, max: maxValue } = getMinMax(allValues);
    const valueRange = maxValue - minValue || 1;
    const scale = generateScale(minValue, maxValue, 5);

    const numPoints = data.labels?.length || 0;
    const pointSpacing = numPoints > 1 ? layout.chartWidth / (numPoints - 1) : 0;

    return { layout, visibleDatasets, minValue, maxValue, valueRange, scale, numPoints, pointSpacing };
  }

  /**
   * Render area chart
   */
  render() {
    const { style, data, options } = this.config;
    const scales = this.calculateScales();
    const { layout, visibleDatasets, minValue, maxValue, valueRange, scale, numPoints, pointSpacing } = scales;
    const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = layout;

    const stacked = options.stacked || false;
    const valueToY = (value) => chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    const indexToX = (index) => chartX + index * pointSpacing;
    const baseline = chartY + chartHeight;

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
        stroke: style.axis.color, strokeWidth: style.axis.width
      });
    }
    if (hasXAxis) {
      this.renderer.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight, {
        stroke: style.axis.color, strokeWidth: style.axis.width
      });
    }

    // Calculate stacked values if needed
    let stackedSums = null;
    if (stacked && visibleDatasets.length > 1) {
      stackedSums = new Array(numPoints).fill(0);
    }

    this.lines = [];
    this._allPoints = [];
    this._crosshairLine = null;

    const smooth = options.smooth;
    const tension = (smooth === true || smooth === 'bezier') ? (style.line?.tension || 0.4) : 0;
    const fillOpacity = style.area?.fillOpacity ?? 0.25;

    const buildPath = (pts) => {
      if (smooth === 'monotone') return getMonotonePath(pts);
      if (tension > 0) return getBezierPath(pts, tension);
      return `M ${pts.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
    };

    visibleDatasets.forEach((dataset, datasetIndex) => {
      if (!dataset.values) return;

      const color = dataset.color || this.getPaletteColor(datasetIndex);
      const lineWidth = dataset.strokeWidth || style.line?.width || 2;
      const isDashed = dataset.dash || false;

      // Build points, accounting for stacking
      const points = dataset.values.map((value, index) => {
        let y;
        if (stacked && stackedSums) {
          stackedSums[index] += value;
          y = valueToY(stackedSums[index]);
        } else {
          y = valueToY(value);
        }
        return [indexToX(index), y];
      });

      // Build bottom edge for fill (previous stack or baseline)
      let bottomPoints;
      if (stacked && stackedSums && datasetIndex > 0) {
        // Bottom is previous cumulative
        const prevSums = new Array(numPoints).fill(0);
        for (let di = 0; di < datasetIndex; di++) {
          const ds = visibleDatasets[di];
          if (ds.values) {
            ds.values.forEach((v, i) => { prevSums[i] += v; });
          }
        }
        bottomPoints = prevSums.map((sum, i) => [indexToX(i), valueToY(sum)]).reverse();
      } else {
        bottomPoints = [
          [points[points.length - 1][0], baseline],
          [points[0][0], baseline]
        ];
      }

      // Draw area fill
      const gradientId = `area-grad-${datasetIndex}`;
      const gradientFill = this.renderer.createGradient?.(color, gradientId, fillOpacity, 0.02) || null;

      if (gradientFill) {
        const linePath = buildPath(points);
        const bottomPath = stacked && datasetIndex > 0
          ? ` L ${bottomPoints[0][0]},${bottomPoints[0][1]}` + buildPath(bottomPoints).replace(/^M/, ' L')
          : ` L ${bottomPoints[0][0]},${bottomPoints[0][1]} L ${bottomPoints[1][0]},${bottomPoints[1][1]}`;
        const areaD = `${linePath}${bottomPath} Z`;
        this.renderer.path(areaD, { fill: gradientFill, opacity: 1 });
      } else {
        // Canvas fallback
        const areaPoints = [...points, ...bottomPoints];
        const areaPath = `M ${areaPoints.map(p => `${p[0]} ${p[1]}`).join(' L ')} Z`;
        this.renderer.path(areaPath, { fill: color, opacity: fillOpacity * 0.5 });
      }

      // Draw line on top
      const linePath = buildPath(points);

      const lineElement = this.renderer.path(linePath, {
        stroke: color,
        strokeWidth: lineWidth,
        strokeDasharray: isDashed ? (dataset.dashPattern || '5 3') : undefined,
        opacity: 1
      });

      // Draw points (hidden, shown on crosshair)
      const pointRadius = options.showPoints !== false ? (style.line?.pointRadius || 4) : 0;
      const pointElements = [];
      points.forEach((point, pointIndex) => {
        if (pointRadius > 0) {
          const pointEl = this.renderer.circle(point[0], point[1], pointRadius, {
            fill: color,
            stroke: style.line?.pointBorderColor || '#ffffff',
            strokeWidth: style.line?.pointBorderWidth || 2,
            opacity: 0
          });
          pointElements.push(pointEl);
          this._allPoints.push({
            element: pointEl, x: point[0], y: point[1],
            value: dataset.values[pointIndex],
            labelIndex: pointIndex, datasetIndex, color,
            datasetLabel: dataset.label
          });
        }
      });

      this.lines.push({ element: lineElement, points, pointElements, color, datasetLabel: dataset.label });
    });

    // Crosshair line
    this._crosshairLine = this.renderer.line(0, chartY, 0, chartY + chartHeight, {
      stroke: style.grid?.color || '#dfe1e6', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0
    });

    // Hit areas for crosshair
    if (numPoints > 0) {
      const colWidth = pointSpacing > 0 ? pointSpacing : chartWidth;
      for (let i = 0; i < numPoints; i++) {
        const cx = indexToX(i);
        const hitX = cx - colWidth / 2;

        const hitbox = this.renderer.rect(hitX, chartY, colWidth, chartHeight, {
          fill: 'transparent', opacity: 0
        });

        if (hitbox) {
          hitbox.style.cursor = 'crosshair';

          this.addElementListener(hitbox, 'mouseenter', (e) => {
            if (this._crosshairLine) {
              this._crosshairLine.setAttribute('x1', cx);
              this._crosshairLine.setAttribute('x2', cx);
              this._crosshairLine.setAttribute('opacity', '1');
            }
            const tooltipData = {};
            this._allPoints.forEach(pt => {
              if (pt.labelIndex === i) {
                if (pt.element) pt.element.setAttribute('opacity', '1');
                tooltipData[pt.datasetLabel || 'Value'] = formatNumber(pt.value, 0);
              }
            });
            this.showTooltip(e, tooltipData);
          });

          this.addElementListener(hitbox, 'mouseleave', () => {
            if (this._crosshairLine) {
              this._crosshairLine.setAttribute('opacity', '0');
            }
            this._allPoints.forEach(pt => {
              if (pt.element) pt.element.setAttribute('opacity', '0');
            });
          });
        }
      }
    }

    // X axis labels
    if (hasXAxis) {
      data.labels?.forEach((label, index) => {
        this.renderer.text(label, indexToX(index), chartY + chartHeight + 15, {
          fill: style.axis.color, fontSize: style.axis.fontSize,
          fontFamily: style.fontFamily, textAnchor: 'middle', dominantBaseline: 'top'
        });
      });
    }
  }

  /**
   * Animate area drawing
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    const easing = this.config.style.animation?.easing || 'easeOutCubic';

    if (!this.lines || !this.lines.length) return;

    this.lines.forEach((line) => {
      this.animateValue({
        from: 0, to: 1, duration, easing,
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

export default AreaChart;
