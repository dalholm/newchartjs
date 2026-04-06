/**
 * Scatter / Bubble Chart implementation
 *
 * Datasets use {x, y, size?, label?} point objects instead of flat value arrays.
 * When `size` is present on points, bubbles are drawn (radius scaled proportionally).
 */

import Chart from '../core/Chart.js';
import { SCATTER_DEFAULTS } from '../core/defaults.js';
import { getMinMax, generateScale, formatNumber, deepMerge } from '../core/utils.js';

export class ScatterChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(SCATTER_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Calculate layout dimensions
   */
  calculateLayout() {
    const padding = this.config.options.padding || 20;
    const hasXAxis = this.config.options.axis?.x?.enabled !== false;
    const hasYAxis = this.config.options.axis?.y?.enabled !== false;

    const topSpace = this.config.options.legend?.enabled ? 40 : 0;
    const bottomSpace = hasXAxis ? 40 : padding;
    const leftSpace = hasYAxis ? 60 : padding;
    const rightSpace = padding + 10;

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
   * Calculate X and Y scales from point data
   */
  calculateScales() {
    const layout = this.calculateLayout();
    const { data } = this.config;

    const visibleDatasets = data.datasets.filter((ds, i) => this.isDatasetVisible(ds, i));

    let allX = [];
    let allY = [];
    let allSizes = [];

    visibleDatasets.forEach(ds => {
      const points = ds.values || ds.points || [];
      points.forEach(p => {
        if (p && typeof p.x === 'number') allX.push(p.x);
        if (p && typeof p.y === 'number') allY.push(p.y);
        if (p && typeof p.size === 'number') allSizes.push(p.size);
      });
    });

    if (allX.length === 0) allX = [0];
    if (allY.length === 0) allY = [0];

    const { min: minX, max: maxX } = getMinMax(allX);
    const { min: minY, max: maxY } = getMinMax(allY);
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;
    const xScale = generateScale(minX, maxX, 5);
    const yScale = generateScale(minY, maxY, 5);

    // Bubble sizing
    const isBubble = allSizes.length > 0;
    const maxSize = allSizes.length > 0 ? Math.max(...allSizes) : 1;
    const minSize = allSizes.length > 0 ? Math.min(...allSizes) : 1;

    return {
      layout,
      visibleDatasets,
      minX, maxX, xRange, xScale,
      minY, maxY, yRange, yScale,
      isBubble, minSize, maxSize
    };
  }

  /**
   * Map data X value to pixel X
   */
  xToPixel(value, chartX, chartWidth, minX, xRange) {
    return chartX + ((value - minX) / xRange) * chartWidth;
  }

  /**
   * Map data Y value to pixel Y
   */
  yToPixel(value, chartY, chartHeight, minY, yRange) {
    return chartY + chartHeight - ((value - minY) / yRange) * chartHeight;
  }

  /**
   * Render scatter/bubble chart
   */
  render() {
    const { style, data, options } = this.config;
    const scales = this.calculateScales();
    const {
      layout, visibleDatasets,
      minX, maxX, xRange, xScale,
      minY, maxY, yRange, yScale,
      isBubble, minSize, maxSize
    } = scales;
    const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = layout;

    const scatterStyle = style.scatter || {};
    const minRadius = scatterStyle.minRadius || 4;
    const maxRadius = scatterStyle.maxRadius || 30;
    const defaultRadius = scatterStyle.pointRadius || 5;

    const toX = (v) => this.xToPixel(v, chartX, chartWidth, minX, xRange);
    const toY = (v) => this.yToPixel(v, chartY, chartHeight, minY, yRange);

    // Draw grid
    if (style.grid?.color) {
      // Horizontal grid (Y scale)
      yScale.forEach((value) => {
        const y = toY(value);
        this.renderer.line(chartX, y, chartX + chartWidth, y, {
          stroke: style.grid.color,
          strokeWidth: style.grid.width || 1,
          opacity: style.grid.opacity ?? 0.5,
          strokeDasharray: style.grid.dash || undefined
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

      // Vertical grid (X scale)
      xScale.forEach((value) => {
        const x = toX(value);
        this.renderer.line(x, chartY, x, chartY + chartHeight, {
          stroke: style.grid.color,
          strokeWidth: style.grid.width || 1,
          opacity: 0.3
        });

        if (hasXAxis) {
          this.renderer.text(formatNumber(value, 0), x, chartY + chartHeight + 15, {
            fill: style.axis.color,
            fontSize: style.axis.fontSize,
            fontFamily: style.fontFamily,
            textAnchor: 'middle',
            dominantBaseline: 'top'
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

    // Axis labels
    const xLabel = options.axis?.x?.label;
    const yLabel = options.axis?.y?.label;
    if (xLabel && hasXAxis) {
      this.renderer.text(xLabel, chartX + chartWidth / 2, chartY + chartHeight + 32, {
        fill: style.axis.color,
        fontSize: style.axis.fontSize,
        fontFamily: style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'top',
        fontWeight: 600
      });
    }
    if (yLabel && hasYAxis) {
      this.renderer.text(yLabel, 14, chartY + chartHeight / 2, {
        fill: style.axis.color,
        fontSize: style.axis.fontSize,
        fontFamily: style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fontWeight: 600,
        transform: `rotate(-90, 14, ${chartY + chartHeight / 2})`
      });
    }

    // Draw reference lines
    const refLines = options.referenceLines || [];
    refLines.forEach(ref => {
      if (ref.axis === 'x' && typeof ref.value === 'number') {
        const rx = toX(ref.value);
        this.renderer.line(rx, chartY, rx, chartY + chartHeight, {
          stroke: ref.color || '#868e96',
          strokeWidth: ref.strokeWidth || 1.5,
          strokeDasharray: ref.dash || '6 4'
        });
        if (ref.label) {
          this.renderer.text(ref.label, rx + 4, chartY + 4, {
            fill: ref.color || '#868e96',
            fontSize: 9,
            fontFamily: style.monoFamily || style.fontFamily,
            textAnchor: 'start',
            dominantBaseline: 'hanging'
          });
        }
      } else if (typeof ref.value === 'number') {
        const ry = toY(ref.value);
        this.renderer.line(chartX, ry, chartX + chartWidth, ry, {
          stroke: ref.color || '#868e96',
          strokeWidth: ref.strokeWidth || 1.5,
          strokeDasharray: ref.dash || '6 4'
        });
        if (ref.label) {
          this.renderer.text(ref.label, chartX + 4, ry - 6, {
            fill: ref.color || '#868e96',
            fontSize: 9,
            fontFamily: style.monoFamily || style.fontFamily,
            textAnchor: 'start',
            dominantBaseline: 'auto'
          });
        }
      }
    });

    // Draw points
    this._points = [];

    visibleDatasets.forEach((dataset, datasetIndex) => {
      const points = dataset.values || dataset.points || [];
      const color = dataset.color || this.getPaletteColor(datasetIndex);
      const fillOpacity = isBubble ? (scatterStyle.bubbleOpacity || 0.6) : (scatterStyle.pointOpacity || 0.85);

      points.forEach((p, pointIndex) => {
        if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return;

        const px = toX(p.x);
        const py = toY(p.y);

        let radius;
        if (isBubble && typeof p.size === 'number' && maxSize > minSize) {
          const normalized = (p.size - minSize) / (maxSize - minSize);
          radius = minRadius + normalized * (maxRadius - minRadius);
        } else if (isBubble && typeof p.size === 'number') {
          radius = (minRadius + maxRadius) / 2;
        } else {
          radius = defaultRadius;
        }

        const el = this.renderer.circle(px, py, radius, {
          fill: color,
          opacity: fillOpacity,
          stroke: isBubble ? color : (style.scatter?.pointBorderColor || '#ffffff'),
          strokeWidth: isBubble ? 1 : (style.scatter?.pointBorderWidth || 2)
        });

        if (el) {
          el.style.cursor = 'pointer';
          el.style.transition = 'opacity 0.12s';

          this.addElementListener(el, 'mouseenter', (e) => {
            // Dim other points
            this._points.forEach(pt => {
              if (pt.element) {
                pt.element.setAttribute('opacity', pt === info ? '1' : '0.2');
              }
            });
            el.setAttribute('opacity', '1');

            const rows = [{
              color,
              label: dataset.label || `Series ${datasetIndex + 1}`,
              value: `(${formatNumber(p.x, 1)}, ${formatNumber(p.y, 1)})`,
              style: 'solid'
            }];

            if (isBubble && typeof p.size === 'number') {
              rows.push({
                color: '#8993a4',
                label: options.sizeLabel || 'Size',
                value: formatNumber(p.size, 0),
                style: 'solid'
              });
            }

            if (p.label) {
              this.showTooltip(e, { header: p.label, rows });
            } else {
              this.showTooltip(e, {
                header: dataset.label || `Series ${datasetIndex + 1}`,
                rows
              });
            }
          });

          this.addElementListener(el, 'mouseleave', () => {
            this._points.forEach(pt => {
              if (pt.element) {
                pt.element.setAttribute('opacity', fillOpacity);
              }
            });
          });
        }

        const info = {
          element: el,
          x: px,
          y: py,
          dataX: p.x,
          dataY: p.y,
          size: p.size,
          radius,
          color,
          label: p.label,
          datasetIndex,
          pointIndex
        };

        this._points.push(info);
      });
    });
  }

  /**
   * Animate points fading + scaling in
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    const easing = this.config.style.animation?.easing || 'easeOutCubic';

    if (!this._points || !this._points.length) return;

    this._points.forEach((pt, index) => {
      const delay = (index / this._points.length) * (duration * 0.4);

      if (pt.element) {
        pt.element.setAttribute('r', 0);
        pt.element.setAttribute('opacity', 0);
      }

      setTimeout(() => {
        this.animateValue({
          from: 0,
          to: 1,
          duration,
          easing,
          onUpdate: (progress) => {
            if (!pt.element) return;
            pt.element.setAttribute('r', pt.radius * progress);
            const scatterStyle = this.config.style.scatter || {};
            const isBubble = this._points.some(p => p.size != null);
            const targetOpacity = isBubble ? (scatterStyle.bubbleOpacity || 0.6) : (scatterStyle.pointOpacity || 0.85);
            pt.element.setAttribute('opacity', targetOpacity * progress);
          }
        });
      }, delay);
    });
  }

  /**
   * Highlight not applicable for scatter — no-op
   */
  highlightColumn() {}
  clearHighlight() {}
}

export default ScatterChart;
