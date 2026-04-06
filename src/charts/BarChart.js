/**
 * Bar Chart implementation
 */

import Chart from '../core/Chart.js';
import { BAR_DEFAULTS } from '../core/defaults.js';
import { getMinMax, generateScale, formatNumber, deepMerge } from '../core/utils.js';
import { delay } from '../core/Animation.js';

export class BarChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(BAR_DEFAULTS, config);
    super(element, mergedConfig);
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

    const isStacked = !!options.stacked;
    const isPercent = options.stacked === 'percent';

    let datasetWidth;
    if (isStacked) {
      datasetWidth = availableWidth;
    } else {
      datasetWidth = availableWidth / Math.max(numDatasets, 1);
    }

    // Compute column totals for percent mode
    let columnTotals = null;
    if (isPercent) {
      columnTotals = new Array(numBars).fill(0);
      visibleDatasets.forEach(ds => {
        if (ds.values) {
          ds.values.forEach((v, i) => { columnTotals[i] += Math.abs(v); });
        }
      });
    }

    // Find min/max values across visible datasets
    let allValues = [];
    if (isPercent) {
      allValues = [0, 100];
    } else {
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
    }

    if (allValues.length === 0) allValues = [0];

    const { min: minValue, max: maxValue } = getMinMax(allValues);
    const valueRange = maxValue - minValue || 1;
    const scale = isPercent
      ? [0, 25, 50, 75, 100]
      : generateScale(minValue, maxValue, 5);

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
      layout,
      isStacked,
      isPercent,
      columnTotals
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
    const { barWidth, availableWidth, datasetWidth, numBars, numDatasets, visibleDatasets, minValue, maxValue, valueRange, scale, isStacked, isPercent, columnTotals } = bars;

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
          const label = isPercent ? `${formatNumber(value, 0)}%` : formatNumber(value, 0);
          this.renderer.text(label, chartX - 10, y, {
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
        fill: this.getPaletteColor(0),
        opacity: 0,
        borderRadius: 2
      });

      const groupBars = [];

      visibleDatasets.forEach((dataset, visibleIndex) => {
        const rawValue = dataset.values?.[labelIndex] || 0;

        // For percent mode, normalize to percentage of column total
        let displayValue;
        if (isPercent && columnTotals && columnTotals[labelIndex] > 0) {
          displayValue = (Math.abs(rawValue) / columnTotals[labelIndex]) * 100;
        } else {
          displayValue = rawValue;
        }

        const normalizedValue = (displayValue - minValue) / valueRange;
        const barHeight = normalizedValue * chartHeight;

        let x, y;

        if (isStacked) {
          let stackedHeight = 0;
          for (let i = 0; i < visibleIndex; i++) {
            const prevRaw = visibleDatasets[i].values?.[labelIndex] || 0;
            let prevDisplay;
            if (isPercent && columnTotals && columnTotals[labelIndex] > 0) {
              prevDisplay = (Math.abs(prevRaw) / columnTotals[labelIndex]) * 100;
            } else {
              prevDisplay = prevRaw;
            }
            const prevNormalized = (prevDisplay - minValue) / valueRange;
            stackedHeight += prevNormalized * chartHeight;
          }
          y = chartY + chartHeight - stackedHeight - barHeight;
          x = baseX - availableWidth / 2;
        } else {
          x = baseX - availableWidth / 2 + visibleIndex * datasetWidth;
          y = chartY + chartHeight - barHeight;
        }

        const color = dataset.color || this.getPaletteColor(visibleIndex);

        // Only round top corners — bottom sits flat on the axis
        const isTopOfStack = isStacked
          ? visibleIndex === visibleDatasets.length - 1
          : true;

        const barElement = this.renderer.rect(
          x, y,
          isStacked ? availableWidth : datasetWidth,
          barHeight,
          {
            fill: color,
            borderRadius: style.bar?.borderRadius || 0,
            borderRadiusTop: isTopOfStack,
            opacity: 1
          }
        );

        if (barElement) {
          barElement.style.cursor = 'pointer';
          barElement.style.transition = 'opacity 0.12s, filter 0.12s';
        }

        const barInfo = {
          element: barElement,
          value: rawValue,
          displayValue,
          label: label,
          datasetLabel: dataset.label,
          color,
          x,
          y,
          width: isStacked ? availableWidth : datasetWidth,
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

          // Build rich tooltip content — bars + markers + reference lines
          const rows = [];
          let currentValue = null;
          let prevValue = null;

          group.bars.forEach(bar => {
            // Detect if this dataset is a dashed/ref series
            const dataset = visibleDatasets[bar.datasetIndex];
            const isDashed = dataset?.dash || dataset?.ref || false;

            rows.push({
              color: bar.color,
              label: bar.datasetLabel || 'Value',
              value: isPercent
                ? `${formatNumber(bar.value, 0)} (${formatNumber(bar.displayValue, 1)}%)`
                : formatNumber(bar.value, 0),
              style: isDashed ? 'dashed' : 'solid'
            });

            // Track first two datasets for YoY calculation
            if (bar.datasetIndex === 0) currentValue = bar.value;
            if (bar.datasetIndex === 1) prevValue = bar.value;
          });

          // Add per-bar marker values (e.g. budget per bar)
          const barMarkers = options.barMarkers || [];
          barMarkers.forEach(marker => {
            const markerValue = marker.values?.[group.labelIndex];
            if (markerValue == null) return;
            rows.push({
              color: marker.color || '#f08c00',
              label: marker.label || 'Target',
              value: formatNumber(markerValue, 0),
              style: 'dashed'
            });
          });

          // Add reference line values (snitt, budget average, etc.)
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

          // Compute change footer if we have two comparable datasets
          let footer = null;
          if (currentValue != null && prevValue != null && prevValue !== 0) {
            const change = ((currentValue - prevValue) / prevValue) * 100;
            const isPositive = change >= 0;
            // Use configured label, or derive from dataset labels
            const footerLabel = options.tooltipChangeLabel
              || `${group.bars[0]?.datasetLabel || ''} vs ${group.bars[1]?.datasetLabel || ''}:`;
            footer = {
              label: footerLabel,
              value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
              color: isPositive ? (this._dark ? '#69db7c' : '#0ca678') : (this._dark ? '#ff8787' : '#e03131')
            };
          }

          this.showTooltip(e, {
            header: group.label,
            rows,
            footer
          });

          // Fire onHover callback
          if (typeof options.onHover === 'function') {
            options.onHover(group.labelIndex, group.label);
          }
        });

        this.addElementListener(hitbox, 'mouseleave', () => {
          this._clearColumnHighlight();

          // Fire onHoverEnd callback
          if (typeof options.onHoverEnd === 'function') {
            options.onHoverEnd();
          }
        });
      }
    });

    // Store group data for programmatic highlight
    this._barGroups = barGroupData;
    this.bars = bars_;
  }

  /**
   * Programmatically highlight a column by label index
   * @param {number} index - Label index to highlight
   */
  highlightColumn(index) {
    if (!this._barGroups || !this.bars) return;
    const group = this._barGroups[index];
    if (!group) return;

    group.highlight.setAttribute('opacity', '0.03');

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

  /**
   * Clear all column highlights
   */
  clearHighlight() {
    this._clearColumnHighlight();
  }

  /**
   * Internal: reset all bars and highlights to default state
   */
  _clearColumnHighlight() {
    if (this._barGroups) {
      this._barGroups.forEach(g => {
        g.highlight.setAttribute('opacity', '0');
      });
    }
    if (this.bars) {
      this.bars.forEach(bar => {
        if (!bar.element) return;
        bar.element.setAttribute('opacity', '1');
        bar.element.style.filter = '';
      });
    }
  }

  /**
   * Animate bars
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    const easing = this.config.style.animation?.easing || 'easeOutCubic';

    if (!this.bars || !this.bars.length) return;

    this.bars.forEach((bar, index) => {
      const staggerDelay = (index / this.bars.length) * (duration * 0.3);

      const cancelDelay = delay(staggerDelay, () => {
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
      });
      this.animationCancels.push(cancelDelay);
    });
  }
}

export default BarChart;
