/**
 * Bar Chart implementation
 */

import Chart from '../core/Chart.js';
import { BAR_DEFAULTS } from '../core/defaults.js';
import { getMinMax, generateScale, formatNumber, deepMerge, lerp } from '../core/utils.js';
import { deepMerge as merge } from '../core/utils.js';

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

    // Calculate available space
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
    const { datasets } = data;

    const numBars = data.labels?.length || 0;
    const numDatasets = datasets.length;

    if (numBars === 0) return [];

    const barWidth = layout.chartWidth / numBars;
    const barGap = barWidth * (this.config.style.bar?.gap || 0.2);
    const availableWidth = barWidth - barGap;

    let datasetWidth;
    if (options.stacked) {
      datasetWidth = availableWidth;
    } else {
      datasetWidth = availableWidth / numDatasets;
    }

    // Find min/max values
    let allValues = [];
    datasets.forEach(ds => {
      if (ds.values) {
        allValues = allValues.concat(ds.values);
      }
    });

    const { min: minValue, max: maxValue } = getMinMax(allValues);
    const valueRange = maxValue - minValue || 1;
    const scale = generateScale(minValue, maxValue, 5);

    return {
      barWidth,
      availableWidth,
      datasetWidth,
      numBars,
      numDatasets,
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
    const { barWidth, availableWidth, datasetWidth, numBars, numDatasets, minValue, maxValue, valueRange, scale } = bars;

    // Draw grid
    if (style.grid?.color) {
      scale.forEach((value, index) => {
        const y = chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        this.renderer.line(chartX, y, chartX + chartWidth, y, {
          stroke: style.grid.color,
          strokeWidth: style.grid.width || 1,
          opacity: 0.5
        });

        // Y axis labels
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

    // Draw bars
    const bars_ = [];

    data.labels.forEach((label, labelIndex) => {
      const baseX = chartX + labelIndex * barWidth + barWidth / 2;

      data.datasets.forEach((dataset, datasetIndex) => {
        const value = dataset.values?.[labelIndex] || 0;
        const normalizedValue = (value - minValue) / valueRange;
        const barHeight = normalizedValue * chartHeight;

        let x, y;

        if (options.stacked) {
          // Stacked bars
          let stackedHeight = 0;
          for (let i = 0; i < datasetIndex; i++) {
            const prevValue = data.datasets[i].values?.[labelIndex] || 0;
            const prevNormalized = (prevValue - minValue) / valueRange;
            stackedHeight += prevNormalized * chartHeight;
          }
          y = chartY + chartHeight - stackedHeight - barHeight;
          x = baseX - availableWidth / 2;
        } else {
          // Grouped bars
          const offset = (datasetIndex - (numDatasets - 1) / 2) * datasetWidth;
          x = baseX - availableWidth / 2 + offset;
          y = chartY + chartHeight - barHeight;
        }

        const color = dataset.color || this.getPaletteColor(datasetIndex);

        const barElement = this.renderer.rect(
          x,
          y,
          options.stacked ? availableWidth : datasetWidth,
          barHeight,
          {
            fill: color,
            borderRadius: style.bar?.borderRadius || 0,
            opacity: 0.85
          }
        );

        bars_.push({
          element: barElement,
          value,
          label: label,
          datasetLabel: dataset.label,
          color,
          x,
          y,
          width: options.stacked ? availableWidth : datasetWidth,
          height: barHeight
        });

        // Hover effect
        if (barElement) {
          barElement.style.cursor = 'pointer';
          barElement.addEventListener('mouseenter', () => {
            barElement.style.opacity = '1';
            this.showTooltip(event, {
              [dataset.label || 'Value']: formatNumber(value, 2),
              [label]: ''
            });
          });

          barElement.addEventListener('mouseleave', () => {
            barElement.style.opacity = '0.85';
          });
        }
      });

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
