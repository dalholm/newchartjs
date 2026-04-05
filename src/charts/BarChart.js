/**
 * Bar Chart implementation
 */

import Chart from '../core/Chart.js';
import { BAR_DEFAULTS } from '../core/defaults.js';
import { getMinMax, generateScale, formatNumber, deepMerge, lerp } from '../core/utils.js';

export class BarChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(BAR_DEFAULTS, config);
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
   * Calculate bar dimensions
   */
  calculateBars() {
    const layout = this.calculateLayout();
    const { data, options } = this.config;

    // Filter datasets by legend visibility
    const visibleDatasets = data.datasets.filter((ds, i) => this.isDatasetVisible(ds, i));
    const numBars = data.labels?.length || 0;
    const numDatasets = visibleDatasets.length;

    if (numBars === 0) return [];

    const barWidth = layout.chartWidth / numBars;
    const barGap = barWidth * (this.config.style.bar?.gap || 0.2);
    const availableWidth = barWidth - barGap;

    let datasetWidth;
    if (options.stacked) {
      datasetWidth = availableWidth;
    } else {
      datasetWidth = availableWidth / Math.max(numDatasets, 1);
    }

    // Find min/max values across visible datasets
    let allValues = [];
    visibleDatasets.forEach(ds => {
      if (ds.values) {
        allValues = allValues.concat(ds.values);
      }
    });

    // Include reference line values in scale
    const refLines = options.referenceLines || [];
    refLines.forEach(ref => {
      if (typeof ref.value === 'number') {
        allValues.push(ref.value);
      }
    });

    if (allValues.length === 0) allValues = [0];

    const { min: minValue, max: maxValue } = getMinMax(allValues);
    const valueRange = maxValue - minValue || 1;
    const scale = generateScale(minValue, maxValue, 5);

    return {
      barWidth,
      availableWidth,
      datasetWidth,
      numBars,
      numDatasets,
      visibleDatasets,
      minValue,
      maxValue,
      valueRange,
      scale,
      layout
    };
  }

  /**
   * Render bar chart
   */
  render() {
    const { style, data, options } = this.config;
    const bars = this.calculateBars();

    if (bars.length === 0) return;

    const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = bars.layout;
    const { barWidth, availableWidth, datasetWidth, numBars, numDatasets, visibleDatasets, minValue, maxValue, valueRange, scale } = bars;

    // Draw grid
    if (style.grid?.color) {
      scale.forEach((value, index) => {
        const y = chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
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

    // Draw reference lines
    const refLines = options.referenceLines || [];
    refLines.forEach(ref => {
      let refValue = ref.value;

      // Handle computed reference values
      if (ref.value === 'average' || ref.value === 'mean') {
        const firstDs = visibleDatasets[0];
        if (firstDs?.values) {
          refValue = Math.round(firstDs.values.reduce((s, v) => s + v, 0) / firstDs.values.length);
        }
      }

      if (typeof refValue !== 'number') return;

      const ry = chartY + chartHeight - ((refValue - minValue) / valueRange) * chartHeight;

      this.renderer.line(chartX, ry, chartX + chartWidth, ry, {
        stroke: ref.color || '#868e96',
        strokeWidth: ref.strokeWidth || 1.5,
        strokeDasharray: ref.dash || '6 4',
        strokeLinecap: 'round'
      });

      // Label — always position inside chart area to avoid clipping
      if (ref.label) {
        const labelX = ref.labelPosition === 'right'
          ? chartX + chartWidth - 6
          : chartX + 4;
        const labelAnchor = ref.labelPosition === 'right' ? 'end' : 'start';
        const labelY = ry - 6;

        // Background pill for label
        if (ref.labelBackground) {
          const pillWidth = ref.label.length * 6 + 12;
          const pillX = ref.labelPosition === 'right'
            ? chartX + chartWidth - pillWidth - 2
            : labelX - 2;
          this.renderer.rect(pillX, labelY - 8, pillWidth, 16, {
            fill: ref.labelBackground,
            borderRadius: 3
          });
        }

        this.renderer.text(ref.label, labelX, labelY, {
          fill: ref.color || '#868e96',
          fontSize: 9,
          fontFamily: style.monoFamily || style.fontFamily,
          textAnchor: labelAnchor,
          dominantBaseline: 'auto',
          fontWeight: ref.labelBackground ? 600 : 400
        });
      }
    });

    // Draw bars
    const bars_ = [];
    const barGroupData = []; // data for hitboxes (created later)

    data.labels.forEach((label, labelIndex) => {
      const baseX = chartX + labelIndex * barWidth + barWidth / 2;
      const groupX = chartX + labelIndex * barWidth;

      // Column highlight background (hidden by default)
      const highlight = this.renderer.rect(groupX + 1, chartY, barWidth - 2, chartHeight, {
        fill: '#4c6ef5',
        opacity: 0,
        borderRadius: 2
      });

      const groupBars = [];

      visibleDatasets.forEach((dataset, visibleIndex) => {
        const value = dataset.values?.[labelIndex] || 0;
        const normalizedValue = (value - minValue) / valueRange;
        const barHeight = normalizedValue * chartHeight;

        let x, y;

        if (options.stacked) {
          let stackedHeight = 0;
          for (let i = 0; i < visibleIndex; i++) {
            const prevValue = visibleDatasets[i].values?.[labelIndex] || 0;
            const prevNormalized = (prevValue - minValue) / valueRange;
            stackedHeight += prevNormalized * chartHeight;
          }
          y = chartY + chartHeight - stackedHeight - barHeight;
          x = baseX - availableWidth / 2;
        } else {
          x = baseX - availableWidth / 2 + visibleIndex * datasetWidth;
          y = chartY + chartHeight - barHeight;
        }

        const color = dataset.color || this.getPaletteColor(visibleIndex);

        const barElement = this.renderer.rect(
          x, y,
          options.stacked ? availableWidth : datasetWidth,
          barHeight,
          {
            fill: color,
            borderRadius: style.bar?.borderRadius || 0,
            opacity: 1
          }
        );

        if (barElement) {
          barElement.style.cursor = 'pointer';
          barElement.style.transition = 'opacity 0.12s, filter 0.12s';
        }

        const barInfo = {
          element: barElement,
          value,
          label: label,
          datasetLabel: dataset.label,
          color,
          x,
          y,
          width: options.stacked ? availableWidth : datasetWidth,
          height: barHeight,
          labelIndex,
          datasetIndex: visibleIndex
        };

        bars_.push(barInfo);
        groupBars.push(barInfo);
      });

      // Per-bar reference markers — span only the actual bars, not the whole column
      const barMarkers = options.barMarkers || [];
      barMarkers.forEach(marker => {
        const markerValue = marker.values?.[labelIndex];
        if (markerValue == null) return;

        const markerY = chartY + chartHeight - ((markerValue - minValue) / valueRange) * chartHeight;
        const markerX1 = baseX - availableWidth / 2;
        const markerX2 = baseX + availableWidth / 2;
        this.renderer.line(markerX1, markerY, markerX2, markerY, {
          stroke: marker.color || '#f08c00',
          strokeWidth: marker.strokeWidth || 2,
          strokeLinecap: 'round'
        });
      });

      barGroupData.push({ groupX, highlight, bars: groupBars, label, labelIndex });

      // X axis labels
      if (hasXAxis) {
        this.renderer.text(label, baseX, chartY + chartHeight + 15, {
          fill: style.axis.color,
          fontSize: style.axis.fontSize,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'top'
        });
      }
    });

    // Create invisible hitboxes AFTER all visible elements so they sit on top in SVG
    barGroupData.forEach(group => {
      const hitbox = this.renderer.rect(group.groupX, chartY, barWidth, chartHeight, {
        fill: 'transparent',
        opacity: 0
      });

      if (hitbox) {
        hitbox.style.cursor = 'pointer';

        this.addElementListener(hitbox, 'mouseenter', (e) => {
          // Show column highlight
          group.highlight.setAttribute('opacity', '0.03');

          // Brighten hovered bars, dim all others
          bars_.forEach(bar => {
            if (!bar.element) return;
            if (bar.labelIndex === group.labelIndex) {
              bar.element.setAttribute('opacity', '1');
              bar.element.style.filter = 'brightness(1.08)';
            } else {
              bar.element.setAttribute('opacity', '0.3');
              bar.element.style.filter = '';
            }
          });

          // Build tooltip content
          const tooltipData = {};
          group.bars.forEach(bar => {
            tooltipData[bar.datasetLabel || 'Value'] = formatNumber(bar.value, 0);
          });

          this.showTooltip(e, tooltipData);
        });

        this.addElementListener(hitbox, 'mouseleave', () => {
          group.highlight.setAttribute('opacity', '0');

          // Restore all bars
          bars_.forEach(bar => {
            if (!bar.element) return;
            bar.element.setAttribute('opacity', '1');
            bar.element.style.filter = '';
          });
        });
      }
    });

    this.bars = bars_;
  }

  /**
   * Animate bars
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    const easing = this.config.style.animation?.easing || 'easeOutCubic';

    if (!this.bars || !this.bars.length) return;

    this.bars.forEach((bar, index) => {
      const delay = (index / this.bars.length) * (duration * 0.3);

      setTimeout(() => {
        this.animateValue({
          from: 0,
          to: 1,
          duration: duration,
          easing: easing,
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
}

export default BarChart;
