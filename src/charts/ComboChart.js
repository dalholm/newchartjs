/**
 * Combo Chart implementation — mix bars and lines on shared axes
 */

import Chart from '../core/Chart.js';
import { COMBO_DEFAULTS } from '../core/defaults.js';
import { getMinMax, generateScale, formatNumber, deepMerge, getBezierPath, getMonotonePath } from '../core/utils.js';

export class ComboChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(COMBO_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Calculate scales for all visible datasets
   */
  calculateScales() {
    const layout = this.calculateLayout();
    const { data, options } = this.config;

    const visibleDatasets = data.datasets.filter((ds, i) => this.isDatasetVisible(ds, i));

    // Separate bar and line datasets
    const barDatasets = [];
    const lineDatasets = [];
    visibleDatasets.forEach((ds, i) => {
      const dsType = ds.type || 'bar';
      if (dsType === 'line') {
        lineDatasets.push({ ...ds, _visibleIndex: i });
      } else {
        barDatasets.push({ ...ds, _visibleIndex: i });
      }
    });

    // Collect all values for unified scale
    let allValues = [];
    visibleDatasets.forEach(ds => {
      if (ds.values) allValues = allValues.concat(ds.values);
    });

    // Include reference line values
    const refLines = options.referenceLines || [];
    refLines.forEach(ref => {
      if (typeof ref.value === 'number') allValues.push(ref.value);
    });

    if (allValues.length === 0) allValues = [0];

    const { min: minValue, max: maxValue } = getMinMax(allValues);
    const valueRange = maxValue - minValue || 1;
    const scale = generateScale(minValue, maxValue, 5);

    const numPoints = data.labels?.length || 0;
    const barWidth = numPoints > 0 ? layout.chartWidth / numPoints : 0;
    const pointSpacing = numPoints > 1 ? layout.chartWidth / (numPoints - 1) : 0;

    return {
      layout,
      visibleDatasets,
      barDatasets,
      lineDatasets,
      minValue,
      maxValue,
      valueRange,
      scale,
      numPoints,
      barWidth,
      pointSpacing
    };
  }

  /**
   * Render combo chart
   */
  render() {
    const { style, data, options } = this.config;
    const scales = this.calculateScales();
    const {
      layout, visibleDatasets, barDatasets, lineDatasets,
      minValue, valueRange, scale, numPoints, barWidth, pointSpacing
    } = scales;
    const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = layout;

    const valueToY = (value) => chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    const indexToX = (index) => chartX + index * barWidth + barWidth / 2;
    const lineIndexToX = (index) => numPoints > 1
      ? chartX + index * pointSpacing
      : chartX + chartWidth / 2;

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

    // Draw reference lines
    const refLines = options.referenceLines || [];
    refLines.forEach(ref => {
      let refValue = ref.value;
      if (ref.value === 'average' || ref.value === 'mean') {
        const firstDs = visibleDatasets[0];
        if (firstDs?.values) {
          refValue = Math.round(firstDs.values.reduce((s, v) => s + v, 0) / firstDs.values.length);
        }
      }
      if (typeof refValue !== 'number') return;

      const ry = valueToY(refValue);
      this.renderer.line(chartX, ry, chartX + chartWidth, ry, {
        stroke: ref.color || '#868e96',
        strokeWidth: ref.strokeWidth || 1.5,
        strokeDasharray: ref.dash || '6 4',
        strokeLinecap: 'round'
      });

      if (ref.label) {
        const labelX = ref.labelPosition === 'right' ? chartX + chartWidth - 6 : chartX + 4;
        const labelAnchor = ref.labelPosition === 'right' ? 'end' : 'start';
        this.renderer.text(ref.label, labelX, ry - 6, {
          fill: ref.color || '#868e96',
          fontSize: 9,
          fontFamily: style.monoFamily || style.fontFamily,
          textAnchor: labelAnchor,
          dominantBaseline: 'auto'
        });
      }
    });

    // --- Draw bars ---
    const bars_ = [];
    const barGroupData = [];
    const barGap = barWidth * (style.combo?.barGap ?? style.bar?.gap ?? 0.2);
    const availableWidth = barWidth - barGap;
    const numBarDatasets = barDatasets.length;
    const datasetWidth = numBarDatasets > 0 ? availableWidth / numBarDatasets : availableWidth;

    data.labels.forEach((label, labelIndex) => {
      const baseX = indexToX(labelIndex);
      const groupX = chartX + labelIndex * barWidth;

      const highlight = this.renderer.rect(groupX + 1, chartY, barWidth - 2, chartHeight, {
        fill: this.getPaletteColor(0),
        opacity: 0,
        borderRadius: 2
      });

      const groupBars = [];

      barDatasets.forEach((dataset, barIndex) => {
        const value = dataset.values?.[labelIndex] || 0;
        const normalizedValue = (value - minValue) / valueRange;
        const barHeight = normalizedValue * chartHeight;
        const x = baseX - availableWidth / 2 + barIndex * datasetWidth;
        const y = chartY + chartHeight - barHeight;
        const color = dataset.color || this.getPaletteColor(dataset._visibleIndex);

        const barElement = this.renderer.rect(x, y, datasetWidth, barHeight, {
          fill: color,
          borderRadius: style.combo?.barBorderRadius ?? style.bar?.borderRadius ?? 4,
          opacity: 1
        });

        if (barElement) {
          barElement.style.cursor = 'pointer';
          barElement.style.transition = 'opacity 0.12s, filter 0.12s';
        }

        const barInfo = {
          element: barElement,
          value,
          label,
          datasetLabel: dataset.label,
          color,
          x, y,
          width: datasetWidth,
          height: barHeight,
          labelIndex,
          datasetIndex: dataset._visibleIndex
        };

        bars_.push(barInfo);
        groupBars.push(barInfo);
      });

      barGroupData.push({ groupX, highlight, bars: groupBars, label, labelIndex });
    });

    // --- Draw lines ---
    this.lines = [];
    this._allPoints = [];
    this._crosshairLine = null;

    lineDatasets.forEach((dataset) => {
      if (!dataset.values) return;

      const color = dataset.color || this.getPaletteColor(dataset._visibleIndex);
      const lineWidth = dataset.strokeWidth || style.combo?.lineWidth || style.line?.width || 2;
      const smooth = options.smooth;
      const tension = (smooth === true || smooth === 'bezier') ? (style.combo?.tension ?? style.line?.tension ?? 0.4) : 0;
      const pointRadius = (options.showPoints !== false) ? (style.combo?.pointRadius ?? style.line?.pointRadius ?? 4) : 0;
      const isDashed = dataset.dash || false;

      // Line points use bar center positions for alignment
      const points = dataset.values.map((value, index) => [
        indexToX(index),
        valueToY(value)
      ]);

      // Draw line
      let linePath;
      if (smooth === 'monotone') {
        linePath = getMonotonePath(points);
      } else if (tension > 0) {
        linePath = getBezierPath(points, tension);
      } else {
        linePath = `M ${points.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
      }

      const lineElement = this.renderer.path(linePath, {
        stroke: color,
        strokeWidth: lineWidth,
        strokeDasharray: isDashed ? (dataset.dashPattern || '5 3') : undefined,
        opacity: 1
      });

      // Draw points
      const pointElements = [];
      points.forEach((point, pointIndex) => {
        if (pointRadius > 0) {
          const isHollow = style.line?.pointFill === 'hollow';
          const pointEl = this.renderer.circle(point[0], point[1], pointRadius, {
            fill: isHollow ? (style.background || '#ffffff') : color,
            stroke: isHollow ? color : (style.line?.pointBorderColor || '#ffffff'),
            strokeWidth: style.line?.pointBorderWidth || 2,
            opacity: 0
          });

          pointElements.push(pointEl);
          this._allPoints.push({
            element: pointEl,
            x: point[0],
            y: point[1],
            value: dataset.values[pointIndex],
            labelIndex: pointIndex,
            datasetIndex: dataset._visibleIndex,
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

    // Crosshair line
    this._crosshairLine = this.renderer.line(0, chartY, 0, chartY + chartHeight, {
      stroke: style.grid?.color || '#dfe1e6',
      strokeWidth: 1,
      strokeDasharray: '3 3',
      opacity: 0
    });

    // --- Hitboxes (on top of everything) ---
    data.labels.forEach((label, i) => {
      const groupX = chartX + i * barWidth;
      const cx = indexToX(i);

      const hitbox = this.renderer.rect(groupX, chartY, barWidth, chartHeight, {
        fill: 'transparent',
        opacity: 0
      });

      if (hitbox) {
        hitbox.style.cursor = 'pointer';

        this.addElementListener(hitbox, 'mouseenter', (e) => {
          // Column highlight
          const group = barGroupData[i];
          if (group) group.highlight.setAttribute('opacity', '0.03');

          // Highlight bars
          bars_.forEach(bar => {
            if (!bar.element) return;
            if (bar.labelIndex === i) {
              bar.element.setAttribute('opacity', '1');
              bar.element.style.filter = 'brightness(1.08)';
            } else {
              bar.element.setAttribute('opacity', '0.3');
              bar.element.style.filter = '';
            }
          });

          // Show crosshair + points
          if (this._crosshairLine) {
            this._crosshairLine.setAttribute('x1', cx);
            this._crosshairLine.setAttribute('x2', cx);
            this._crosshairLine.setAttribute('opacity', '1');
          }
          this._allPoints.forEach(pt => {
            if (pt.element) {
              pt.element.setAttribute('opacity', pt.labelIndex === i ? '1' : '0');
            }
          });

          // Build tooltip
          const rows = [];
          // Bar rows
          if (group) {
            group.bars.forEach(bar => {
              rows.push({
                color: bar.color,
                label: bar.datasetLabel || 'Value',
                value: formatNumber(bar.value, 0),
                style: 'solid'
              });
            });
          }
          // Line rows
          this._allPoints.forEach(pt => {
            if (pt.labelIndex === i) {
              const ds = visibleDatasets[pt.datasetIndex];
              rows.push({
                color: pt.color,
                label: pt.datasetLabel || 'Value',
                value: formatNumber(pt.value, 0),
                style: ds?.dash ? 'dashed' : 'solid'
              });
            }
          });

          // Add reference line values
          refLines.forEach(ref => {
            let refValue = ref.value;
            if (ref.value === 'average' || ref.value === 'mean') {
              const firstDs = visibleDatasets[0];
              if (firstDs?.values) {
                refValue = Math.round(firstDs.values.reduce((s, v) => s + v, 0) / firstDs.values.length);
              }
            }
            if (typeof refValue !== 'number') return;
            rows.push({
              color: ref.color || '#868e96',
              label: ref.label || 'Ref',
              value: formatNumber(refValue, 0),
              style: 'dashed'
            });
          });

          this.showTooltip(e, {
            header: label,
            rows
          });

          if (typeof options.onHover === 'function') {
            options.onHover(i, label);
          }
        });

        this.addElementListener(hitbox, 'mouseleave', () => {
          this._clearHighlights();
          if (typeof options.onHoverEnd === 'function') {
            options.onHoverEnd();
          }
        });
      }
    });

    // X axis labels
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

    this._barGroups = barGroupData;
    this.bars = bars_;
  }

  /**
   * Programmatically highlight a column
   * @param {number} index - Label index
   */
  highlightColumn(index) {
    if (!this._barGroups) return;
    const group = this._barGroups[index];
    if (group) group.highlight.setAttribute('opacity', '0.03');

    if (this.bars) {
      this.bars.forEach(bar => {
        if (!bar.element) return;
        if (bar.labelIndex === index) {
          bar.element.setAttribute('opacity', '1');
          bar.element.style.filter = 'brightness(1.08)';
        } else {
          bar.element.setAttribute('opacity', '0.3');
          bar.element.style.filter = '';
        }
      });
    }

    // Show line points
    if (this._allPoints) {
      this._allPoints.forEach(pt => {
        if (pt.element) {
          pt.element.setAttribute('opacity', pt.labelIndex === index ? '1' : '0');
        }
      });
    }
  }

  /**
   * Clear all highlights
   */
  clearHighlight() {
    this._clearHighlights();
  }

  /**
   * Internal: reset bars, points, crosshair
   */
  _clearHighlights() {
    if (this._barGroups) {
      this._barGroups.forEach(g => g.highlight.setAttribute('opacity', '0'));
    }
    if (this.bars) {
      this.bars.forEach(bar => {
        if (!bar.element) return;
        bar.element.setAttribute('opacity', '1');
        bar.element.style.filter = '';
      });
    }
    if (this._crosshairLine) {
      this._crosshairLine.setAttribute('opacity', '0');
    }
    if (this._allPoints) {
      this._allPoints.forEach(pt => {
        if (pt.element) pt.element.setAttribute('opacity', '0');
      });
    }
  }

  /**
   * Animate bars growing up and lines drawing in
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    const easing = this.config.style.animation?.easing || 'easeOutCubic';

    // Animate bars
    if (this.bars && this.bars.length) {
      this.bars.forEach((bar, index) => {
        const delay = (index / this.bars.length) * (duration * 0.3);
        setTimeout(() => {
          this.animateValue({
            from: 0,
            to: 1,
            duration,
            easing,
            onUpdate: (progress) => {
              const currentHeight = bar.height * progress;
              const y = bar.y + bar.height - currentHeight;
              if (bar.element) {
                bar.element.setAttribute('height', currentHeight);
                bar.element.setAttribute('y', y);
              }
            }
          });
        }, delay);
      });
    }

    // Animate lines
    if (this.lines && this.lines.length) {
      this.lines.forEach((line) => {
        this.animateValue({
          from: 0,
          to: 1,
          duration,
          easing,
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
}

export default ComboChart;
