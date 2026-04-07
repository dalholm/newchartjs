/**
 * Bar Chart implementation
 */

import Chart from '../core/Chart.js';
import { BAR_DEFAULTS } from '../core/defaults.js';
import { getMinMax, generateScale, deepMerge } from '../core/utils.js';
import { delay } from '../core/Animation.js';
import { DrillDownManager } from '../core/DrillDownManager.js';
import { Breadcrumb } from '../core/Breadcrumb.js';

export class BarChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(BAR_DEFAULTS, config);
    super(element, mergedConfig);
    this._scrollWrapper = null;

    // Drill-down state
    this._drillManager = null;
    this._breadcrumb = null;
    if (mergedConfig.options.drillDown) {
      this._drillManager = new DrillDownManager({
        data: mergedConfig.data,
        onDrillDown: mergedConfig.options.onDrillDown,
        rootLabel: mergedConfig.options.drillDownRootLabel || 'All'
      });
    }
  }

  /**
   * Determine label rotation and interval based on available space
   * @param {number} barWidth - Width per bar group in px
   * @param {number} numBars - Total number of bars
   * @param {string[]} labels - Label strings
   * @returns {{ rotation: number, interval: number, bottomSpace: number }}
   */
  calculateLabelStrategy(barWidth, numBars, labels) {
    const opts = this.config.options.labels || {};
    const fontSize = this.config.style.axis?.fontSize || 12;
    const avgCharWidth = fontSize * 0.6;

    // Find the widest label
    const maxLabelWidth = labels.reduce((max, l) => Math.max(max, (l || '').length * avgCharWidth), 0);

    // User-specified overrides
    let rotation = opts.rotation ?? 'auto';
    let interval = opts.interval ?? 'auto';

    if (rotation === 'auto') {
      if (maxLabelWidth <= barWidth * 0.9) {
        rotation = 0;
      } else if (maxLabelWidth <= barWidth * 1.8) {
        rotation = -45;
      } else {
        rotation = -90;
      }
    }

    if (interval === 'auto') {
      // With rotation, labels take less horizontal space
      const effectiveLabelWidth = rotation === 0
        ? maxLabelWidth
        : rotation === -45
          ? maxLabelWidth * 0.7
          : fontSize + 4; // vertical labels are ~fontSize wide

      if (effectiveLabelWidth <= barWidth * 0.95) {
        interval = 1;
      } else {
        interval = Math.ceil(effectiveLabelWidth / (barWidth * 0.95));
      }
    }

    // Calculate extra bottom space needed for rotated labels
    let bottomSpace = 40; // default
    if (rotation === -45) {
      bottomSpace = Math.min(80, 40 + maxLabelWidth * 0.5);
    } else if (rotation === -90) {
      bottomSpace = Math.min(100, 40 + maxLabelWidth * 0.6);
    }

    return { rotation, interval, bottomSpace };
  }

  /**
   * Setup horizontal scroll container when maxVisibleBars is set
   * @param {number} numBars - Total number of bars
   * @returns {{ virtualWidth: number, scrollEnabled: boolean }}
   */
  setupScrollContainer(numBars) {
    const maxVisible = this.config.options.maxVisibleBars;
    if (!maxVisible || numBars <= maxVisible) {
      // Remove scroll wrapper if it was previously created
      if (this._scrollWrapper) {
        if (this._scrollWrapper.parentNode) {
          const rendererEl = this.renderer.svg || this.renderer.canvas;
          if (rendererEl && this._scrollWrapper.contains(rendererEl)) {
            this.container.appendChild(rendererEl);
          }
          this._scrollWrapper.remove();
        }
        this._scrollWrapper = null;
      }
      return { virtualWidth: this.width, scrollEnabled: false };
    }

    // Calculate virtual width: give each bar the same width it would have with maxVisible bars
    const idealBarWidth = this.width / maxVisible;
    const virtualWidth = Math.ceil(idealBarWidth * numBars);

    // Reset if wrapper was detached (e.g. by renderer.init() clearing container)
    if (this._scrollWrapper && !this._scrollWrapper.parentNode) {
      this._scrollWrapper = null;
    }

    // Create scroll wrapper
    if (!this._scrollWrapper) {
      this._scrollWrapper = document.createElement('div');
      this._scrollWrapper.style.overflowX = 'auto';
      this._scrollWrapper.style.overflowY = 'hidden';
      this._scrollWrapper.style.width = '100%';
      this._scrollWrapper.style.height = '100%';
      this._scrollWrapper.style.position = 'relative';

      // Scroll fade hint on right edge
      this._scrollWrapper.style.maskImage = 'linear-gradient(to right, black 92%, transparent 100%)';
      this._scrollWrapper.style.webkitMaskImage = 'linear-gradient(to right, black 92%, transparent 100%)';

      // Remove fade when scrolled to end
      this._scrollWrapper.addEventListener('scroll', () => {
        const { scrollLeft, scrollWidth, clientWidth } = this._scrollWrapper;
        const atEnd = scrollLeft + clientWidth >= scrollWidth - 2;
        const atStart = scrollLeft <= 2;
        if (atEnd) {
          this._scrollWrapper.style.maskImage = atStart ? 'none' : 'linear-gradient(to left, black 92%, transparent 100%)';
          this._scrollWrapper.style.webkitMaskImage = atStart ? 'none' : 'linear-gradient(to left, black 92%, transparent 100%)';
        } else if (atStart) {
          this._scrollWrapper.style.maskImage = 'linear-gradient(to right, black 92%, transparent 100%)';
          this._scrollWrapper.style.webkitMaskImage = 'linear-gradient(to right, black 92%, transparent 100%)';
        } else {
          this._scrollWrapper.style.maskImage = 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)';
          this._scrollWrapper.style.webkitMaskImage = 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)';
        }
      });
    }

    // Move renderer element into scroll wrapper
    const rendererEl = this.renderer.svg || this.renderer.canvas;
    if (rendererEl) {
      this.container.appendChild(this._scrollWrapper);
      this._scrollWrapper.appendChild(rendererEl);

      // Resize SVG to virtual width
      if (this.renderer.svg) {
        this.renderer.svg.setAttribute('width', virtualWidth);
        this.renderer.svg.setAttribute('viewBox', `0 0 ${virtualWidth} ${this.height}`);
        this.renderer.svg.style.maxWidth = 'none';
        this.renderer.svg.style.width = `${virtualWidth}px`;
      }
    }

    return { virtualWidth, scrollEnabled: true };
  }

  /**
   * Override layout to account for rotated label space
   */
  calculateLayout() {
    const base = super.calculateLayout();
    const ls = this._labelStrategy;
    if (ls && ls.bottomSpace > base.bottomSpace) {
      const extra = ls.bottomSpace - base.bottomSpace;
      base.bottomSpace = ls.bottomSpace;
      base.chartHeight -= extra;
    }
    return base;
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

    // Use virtual width for bar sizing when scroll is enabled
    const effectiveChartWidth = this._virtualWidth && this._virtualWidth > this.width
      ? this._virtualWidth - layout.leftSpace - layout.rightSpace
      : layout.chartWidth;

    const barWidth = effectiveChartWidth / numBars;
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
        // When forecast split bars exist, ensure scale starts at 0
        // so the actual portion is visible
        if (ds.actual) {
          let hasActual = false;
          ds.actual.forEach(v => { if (v != null) hasActual = true; });
          if (hasActual) allValues.push(0);
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
    const numBarsTotal = data.labels?.length || 0;

    // Setup scroll container before calculating bars (may change virtual width)
    const { virtualWidth, scrollEnabled } = this.setupScrollContainer(numBarsTotal);

    // Calculate label strategy for rotation/thinning
    const labelStrategy = this.calculateLabelStrategy(
      (virtualWidth || this.width) / Math.max(numBarsTotal, 1),
      numBarsTotal,
      data.labels || []
    );

    // Store for use in calculateBars if needed
    this._labelStrategy = labelStrategy;
    this._virtualWidth = virtualWidth;

    const bars = this.calculateBars();

    if (bars.length === 0) return;

    let { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = bars.layout;
    const { barWidth, availableWidth, datasetWidth, numBars, numDatasets, visibleDatasets, minValue, maxValue, valueRange, scale, isStacked, isPercent, columnTotals } = bars;

    // If scrolling, override chart width to use virtual width
    if (scrollEnabled) {
      const leftSpace = hasYAxis ? 60 : (options.padding || 20);
      const rightSpace = options.padding || 20;
      chartWidth = virtualWidth - leftSpace - rightSpace;
    }

    // Draw grid
    if (style.grid?.color) {
      scale.forEach((value, index) => {
        const y = chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        this.renderer.line(chartX, y, chartX + chartWidth, y, {
          stroke: style.grid.color,
          strokeWidth: style.grid.width || 1,
          opacity: style.grid.opacity ?? 0.5,
          strokeDasharray: style.grid.dash || undefined
        });

        if (hasYAxis) {
          const label = isPercent ? `${this.formatValue(value, 0)}%` : this.formatValue(value, 0);
          this.renderer.text(label, chartX - 10, y, {
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

        const barW = isStacked ? availableWidth : datasetWidth;

        // Forecast detection
        const isForecast = dataset.forecast?.[labelIndex] === true;
        const actualValue = dataset.actual?.[labelIndex];
        const hasSplit = isForecast && actualValue != null && actualValue < rawValue;
        const forecastStyle = style.forecast || {};

        // Bar gradient overlay (if enabled)
        const useGradient = style.bar?.gradient && this.renderer.createBarGradient;
        let gradientUrl = null;
        if (useGradient) {
          const gid = `bar-grad-${labelIndex}-${visibleIndex}`;
          gradientUrl = this.renderer.createBarGradient(color, gid);
        }

        let barElement;
        let forecastElement = null;
        let actualHeight = barHeight;
        let forecastHeight = 0;

        if (hasSplit) {
          // Split bar: solid actual portion + striped forecast portion
          const actualNorm = Math.max(0, Math.min(barHeight, ((actualValue - minValue) / valueRange) * chartHeight));
          forecastHeight = barHeight - actualNorm;
          actualHeight = actualNorm;

          // Solid actual bar (bottom)
          barElement = this.renderer.rect(
            x, y + forecastHeight, barW, actualHeight,
            { fill: color, borderRadius: 0, opacity: 1 }
          );

          // Striped forecast bar (top)
          const patternId = `fc-stripe-${labelIndex}-${visibleIndex}`;
          const patternUrl = this.renderer.createStripePattern?.(
            color, patternId, forecastStyle.stripeWidth || 4, forecastStyle.opacity || 0.35
          );

          forecastElement = this.renderer.rect(
            x, y, barW, forecastHeight,
            {
              fill: patternUrl || color,
              borderRadius: style.bar?.borderRadius || 0,
              borderRadiusTop: isTopOfStack,
              opacity: 1
            }
          );

          // Dashed border on forecast portion
          if (forecastElement && forecastStyle.borderDash) {
            forecastElement.setAttribute('stroke', color);
            forecastElement.setAttribute('stroke-width', '1');
            forecastElement.setAttribute('stroke-dasharray', forecastStyle.borderDash);
            forecastElement.setAttribute('stroke-opacity', '0.6');
          }

          // Divider line between actual and forecast
          const splitY = y + forecastHeight;
          this.renderer.line(x, splitY, x + barW, splitY, {
            stroke: color,
            strokeWidth: 1.5,
            strokeDasharray: '4 2',
            strokeLinecap: 'round'
          });

          // Actual value label inside bar (if bar is wide enough)
          if (barW > 28 && actualHeight > 16) {
            this.renderer.text(this.formatValue(actualValue, 0), x + barW / 2, splitY - 6, {
              fill: '#ffffff',
              fontSize: Math.min(10, barW / 5),
              fontFamily: style.monoFamily || style.fontFamily,
              fontWeight: 600,
              textAnchor: 'middle',
              dominantBaseline: 'auto'
            });
          }
        } else if (isForecast) {
          // Full forecast bar — entire bar is striped
          const patternId = `fc-stripe-${labelIndex}-${visibleIndex}`;
          const patternUrl = this.renderer.createStripePattern?.(
            color, patternId, forecastStyle.stripeWidth || 4, forecastStyle.opacity || 0.35
          );

          barElement = this.renderer.rect(
            x, y, barW, barHeight,
            {
              fill: patternUrl || color,
              borderRadius: style.bar?.borderRadius || 0,
              borderRadiusTop: isTopOfStack,
              opacity: 1
            }
          );

          // Dashed border
          if (barElement && forecastStyle.borderDash) {
            barElement.setAttribute('stroke', color);
            barElement.setAttribute('stroke-width', '1');
            barElement.setAttribute('stroke-dasharray', forecastStyle.borderDash);
            barElement.setAttribute('stroke-opacity', '0.6');
          }
        } else {
          // Normal solid bar
          barElement = this.renderer.rect(
            x, y, barW, barHeight,
            {
              fill: color,
              borderRadius: style.bar?.borderRadius || 0,
              borderRadiusTop: isTopOfStack,
              opacity: 1
            }
          );

          // Add gradient overlay as a second rect
          if (gradientUrl && barHeight > 0) {
            this.renderer.rect(x, y, barW, barHeight, {
              fill: gradientUrl,
              borderRadius: style.bar?.borderRadius || 0,
              borderRadiusTop: isTopOfStack,
              opacity: 1
            });
          }
        }

        // Bar shadow
        const barShadow = style.bar?.shadow;
        if (barElement && barShadow && this.renderer.ensureShadowFilter) {
          const filterUrl = this.renderer.ensureShadowFilter(barShadow);
          barElement.setAttribute('filter', filterUrl);
        }

        if (barElement) {
          barElement.style.cursor = 'pointer';
          barElement.style.transition = 'opacity 0.12s, filter 0.12s';
        }
        if (forecastElement) {
          forecastElement.style.cursor = 'pointer';
          forecastElement.style.transition = 'opacity 0.12s, filter 0.12s';
        }

        const barInfo = {
          element: barElement,
          forecastElement,
          value: rawValue,
          displayValue,
          actualValue: hasSplit ? actualValue : null,
          isForecast,
          label: label,
          datasetLabel: dataset.label,
          color,
          x,
          y,
          width: isStacked ? availableWidth : datasetWidth,
          height: barHeight,
          actualHeight: hasSplit ? actualHeight : barHeight,
          forecastHeight,
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

      // X axis labels — with rotation and interval support
      if (hasXAxis) {
        const ls = this._labelStrategy || { rotation: 0, interval: 1 };
        const showLabel = (labelIndex % ls.interval) === 0;

        if (showLabel) {
          const labelOpts = {
            fill: style.axis.color,
            fontSize: style.axis.fontSize,
            fontFamily: style.fontFamily,
            dominantBaseline: 'top'
          };

          if (ls.rotation && ls.rotation !== 0) {
            labelOpts.rotate = ls.rotation;
            labelOpts.textAnchor = ls.rotation < 0 ? 'end' : 'start';
            this.renderer.text(label, baseX, chartY + chartHeight + 8, labelOpts);
          } else {
            labelOpts.textAnchor = 'middle';
            this.renderer.text(label, baseX, chartY + chartHeight + 15, labelOpts);
          }
        }
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
              if (bar.forecastElement) {
                bar.forecastElement.setAttribute('opacity', '1');
                bar.forecastElement.style.filter = 'brightness(1.08)';
              }
            } else {
              bar.element.setAttribute('opacity', '0.3');
              bar.element.style.filter = '';
              if (bar.forecastElement) {
                bar.forecastElement.setAttribute('opacity', '0.3');
                bar.forecastElement.style.filter = '';
              }
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

            if (bar.isForecast && bar.actualValue != null) {
              // Split bar: show actual + forecast as separate rows
              rows.push({
                color: bar.color,
                label: `${bar.datasetLabel || 'Value'} (actual)`,
                value: isPercent
                  ? `${this.formatValue(bar.actualValue, 0)}`
                  : this.formatValue(bar.actualValue, 0),
                style: 'solid'
              });
              rows.push({
                color: bar.color,
                label: `${bar.datasetLabel || 'Value'} (forecast)`,
                value: isPercent
                  ? `${this.formatValue(bar.value, 0)} (${this.formatValue(bar.displayValue, 1)}%)`
                  : this.formatValue(bar.value, 0),
                style: 'dashed'
              });
            } else {
              rows.push({
                color: bar.color,
                label: (bar.isForecast ? `${bar.datasetLabel || 'Value'} (forecast)` : bar.datasetLabel || 'Value'),
                value: isPercent
                  ? `${this.formatValue(bar.value, 0)} (${this.formatValue(bar.displayValue, 1)}%)`
                  : this.formatValue(bar.value, 0),
                style: (isDashed || bar.isForecast) ? 'dashed' : 'solid'
              });
            }

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
              value: this.formatValue(markerValue, 0),
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
              value: this.formatValue(refValue, 0),
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

        // Drill-down click handler
        if (this._drillManager) {
          const canDrill = this._drillManager.canDrillDown(group.label);
          if (canDrill) {
            hitbox.style.cursor = 'pointer';
            this.addElementListener(hitbox, 'click', () => {
              this._handleDrillDown(group.label);
            });
          }
        }
      }
    });

    // Store group data for programmatic highlight
    this._barGroups = barGroupData;
    this.bars = bars_;

    // Setup breadcrumb after bars are rendered
    if (this._drillManager) {
      this._setupBreadcrumb();
    }
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
        if (bar.forecastElement) {
          bar.forecastElement.setAttribute('opacity', '1');
          bar.forecastElement.style.filter = 'brightness(1.08)';
        }
      } else {
        bar.element.setAttribute('opacity', '0.3');
        bar.element.style.filter = '';
        if (bar.forecastElement) {
          bar.forecastElement.setAttribute('opacity', '0.3');
          bar.forecastElement.style.filter = '';
        }
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
        if (bar.forecastElement) {
          bar.forecastElement.setAttribute('opacity', '1');
          bar.forecastElement.style.filter = '';
        }
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

            if (bar.forecastElement) {
              // Split bar: animate both actual (bottom) and forecast (top)
              const fcH = bar.forecastHeight * progress;
              const actH = bar.actualHeight * progress;
              bar.forecastElement.setAttribute('height', fcH);
              bar.forecastElement.setAttribute('y', bar.y + bar.height - currentHeight);
              if (bar.element) {
                bar.element.setAttribute('height', actH);
                bar.element.setAttribute('y', bar.y + bar.height - actH);
              }
            } else if (bar.element) {
              bar.element.setAttribute('height', currentHeight);
              bar.element.setAttribute('y', y);
            }
          }
        });
      });
      this.animationCancels.push(cancelDelay);
    });
  }

  // ── Drill-down methods ─────────────────────────────────────────────

  /**
   * Handle drill-down into a bar label
   * @param {string} label - The bar label to drill into
   */
  async _handleDrillDown(label) {
    if (!this._drillManager || !this._drillManager.canDrillDown(label)) return;

    this._setDrillLoading(true);
    try {
      const childData = await this._drillManager.drillDown(label);
      this._applyDrillData(childData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Drill-down failed:', err.message);
    } finally {
      this._setDrillLoading(false);
    }
  }

  /**
   * Apply drill-down data and re-render the chart
   * @param {Object} data - New chart data ({ labels, datasets, children? })
   */
  _applyDrillData(data) {
    // Reset scroll position
    if (this._scrollWrapper) {
      this._scrollWrapper.scrollLeft = 0;
    }

    // Update chart with new data (triggers full draw lifecycle)
    this.update({ data });
  }

  /**
   * Create or update the breadcrumb navigation
   */
  _setupBreadcrumb() {
    if (!this._drillManager) return;

    const items = this._drillManager.breadcrumbItems;

    if (!this._breadcrumb) {
      const bcStyle = this.config.style.breadcrumb || {};
      this._breadcrumb = new Breadcrumb(this.container, {
        ...bcStyle,
        dark: this._dark,
        fontFamily: this.config.style.fontFamily,
        onClick: (level) => {
          this._drillManager.navigateTo(level);
          this._applyDrillData(this._drillManager.currentData);
        }
      });
      this._breadcrumb.mount();
    }

    this._breadcrumb.update(items);
  }

  /**
   * Show or hide a loading state during async drill-down
   * @param {boolean} loading
   */
  _setDrillLoading(loading) {
    const rendererEl = this.renderer?.svg || this.renderer?.canvas;
    if (rendererEl) {
      rendererEl.style.opacity = loading ? '0.4' : '1';
      rendererEl.style.transition = 'opacity 0.15s';
    }
  }

  /**
   * Navigate up one or more drill levels (public API)
   * @param {number} [level] - Target level (0 = root). Omit to go up one level.
   */
  drillUp(level) {
    if (!this._drillManager) return;
    if (level !== undefined) {
      this._drillManager.navigateTo(level);
    } else {
      this._drillManager.navigateTo(this._drillManager.currentLevel - 1);
    }
    this._applyDrillData(this._drillManager.currentData);
  }

  /**
   * Navigate to a specific drill level (public API)
   * @param {number} level - Target level (0 = root)
   */
  drillTo(level) {
    this.drillUp(level);
  }

  /**
   * Override destroy to clean up breadcrumb
   */
  destroy() {
    if (this._breadcrumb) {
      this._breadcrumb.destroy();
      this._breadcrumb = null;
    }
    this._drillManager = null;
    super.destroy();
  }
}

export default BarChart;
