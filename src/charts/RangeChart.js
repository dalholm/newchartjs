/**
 * Range Chart implementation
 * Timeline/line chart with annotated zones, bands, and campaign markers
 */

import Chart from '../core/Chart.js';
import { RANGE_DEFAULTS } from '../core/defaults.js';
import { deepMerge } from '../core/utils.js';

export class RangeChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(RANGE_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Render range chart with line + annotated zones
   */
  render() {
    const { data, style, options } = this.config;
    if (!data.datasets?.length) return;

    const layout = this.calculateLayout();
    const { chartX, chartY, chartWidth, chartHeight, hasXAxis, hasYAxis } = layout;

    const labels = data.labels || [];
    const zones = data.zones || []; // { from, to, color, label, opacity }
    const annotations = data.annotations || []; // { index, label, color }

    // Calculate Y scale across all visible datasets
    let allValues = [];
    data.datasets.forEach((ds, i) => {
      if (!this.isDatasetVisible(ds, i)) return;
      if (ds.values) allValues = allValues.concat(ds.values.filter(v => v !== null));
    });

    const minVal = Math.min(...allValues) * 0.95;
    const maxVal = Math.max(...allValues) * 1.05;
    const range = maxVal - minVal || 1;

    const scaleX = (index) => chartX + (index / (labels.length - 1)) * chartWidth;
    const scaleY = (val) => chartY + chartHeight - ((val - minVal) / range) * chartHeight;

    // Draw grid
    const gridCount = 5;
    for (let i = 0; i <= gridCount; i++) {
      const val = minVal + range * (i / gridCount);
      const y = scaleY(val);

      this.renderer.line(chartX, y, chartX + chartWidth, y, {
        stroke: style.grid?.color || '#E5E7EB',
        strokeWidth: style.grid?.width || 1,
        opacity: style.grid?.opacity || 0.5
      });

      if (hasYAxis) {
        this.renderer.text(this.formatValue(val, 0), chartX - 8, y, {
          fill: style.axis?.color || style.fontColor,
          fontSize: style.axis?.fontSize || 11,
          fontFamily: style.fontFamily,
          textAnchor: 'end',
          dominantBaseline: 'middle'
        });
      }
    }

    // Draw zones (colored bands behind the chart)
    zones.forEach(zone => {
      const x1 = scaleX(zone.from);
      const x2 = scaleX(zone.to);
      const zoneWidth = x2 - x1;

      this.renderer.rect(x1, chartY, zoneWidth, chartHeight, {
        fill: zone.color || '#4c6ef5',
        opacity: zone.opacity || 0.08,
        borderRadius: 2
      });

      // Zone label at top
      if (zone.label) {
        this.renderer.text(zone.label, x1 + zoneWidth / 2, chartY + 6, {
          fill: zone.color || '#4c6ef5',
          fontSize: 9,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'hanging',
          fontWeight: 600
        });
      }
    });

    // Draw lines
    data.datasets.forEach((dataset, di) => {
      if (!this.isDatasetVisible(dataset, di)) return;
      if (!dataset.values) return;

      const color = dataset.color || this.getPaletteColor(di);
      const lineWidth = style.range?.lineWidth || 2;
      const isDashed = dataset.dash || false;

      // Build points
      const points = [];
      dataset.values.forEach((val, i) => {
        if (val !== null && val !== undefined) {
          points.push([scaleX(i), scaleY(val)]);
        }
      });

      if (points.length < 2) return;

      // Area fill if dataset.fill
      if (dataset.fill) {
        const gradientId = `range-grad-${di}`;
        const gradientFill = this.renderer.createGradient?.(color, gradientId, 0.2, 0.02);

        if (gradientFill) {
          const areaPoints = [...points];
          areaPoints.push([points[points.length - 1][0], chartY + chartHeight]);
          areaPoints.push([points[0][0], chartY + chartHeight]);

          this.renderer.polyline(areaPoints, {
            fill: gradientFill,
            stroke: 'none'
          });
        }
      }

      // Line
      const lineStyle = {
        stroke: color,
        strokeWidth: lineWidth,
        fill: 'none'
      };
      if (isDashed) lineStyle.strokeDasharray = '6 3';

      this.renderer.polyline(points, lineStyle);

      // Data points
      if (options.showPoints !== false) {
        const pointRadius = style.range?.pointRadius || 3;

        dataset.values.forEach((val, i) => {
          if (val === null) return;
          const px = scaleX(i);
          const py = scaleY(val);

          const dot = this.renderer.circle(px, py, pointRadius, {
            fill: color,
            stroke: style.background || '#ffffff',
            strokeWidth: 2
          });

          if (dot) {
            dot.style.cursor = 'pointer';

            this.addElementListener(dot, 'mouseenter', (e) => {
              dot.setAttribute('r', String(pointRadius + 2));

              const tooltipData = {};
              data.datasets.forEach((ds, dsi) => {
                if (ds.values?.[i] !== null && ds.values?.[i] !== undefined) {
                  tooltipData[ds.label || `Series ${dsi + 1}`] = this.formatValue(ds.values[i], 0);
                }
              });

              // Check if point is in a zone
              const activeZone = zones.find(z => i >= z.from && i <= z.to);
              if (activeZone?.label) {
                tooltipData['Period'] = activeZone.label;
              }

              this.showTooltip(e, tooltipData);
            });

            this.addElementListener(dot, 'mouseleave', () => {
              dot.setAttribute('r', String(pointRadius));
            });
          }
        });
      }
    });

    // Draw annotations (vertical markers)
    annotations.forEach(ann => {
      const x = scaleX(ann.index);
      const color = ann.color || '#e03131';

      this.renderer.line(x, chartY, x, chartY + chartHeight, {
        stroke: color,
        strokeWidth: 1.5,
        strokeDasharray: '4 3'
      });

      if (ann.label) {
        // Label background
        this.renderer.rect(x - 2, chartY + chartHeight + 2, 0, 0, {}); // placeholder

        this.renderer.text(ann.label, x, chartY + chartHeight + 10, {
          fill: color,
          fontSize: 9,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'hanging',
          fontWeight: 600
        });
      }
    });

    // X-axis labels
    if (hasXAxis) {
      const step = Math.max(1, Math.floor(labels.length / 12));
      labels.forEach((label, i) => {
        if (i % step !== 0 && i !== labels.length - 1) return;
        this.renderer.text(label, scaleX(i), chartY + chartHeight + 8, {
          fill: style.axis?.color || style.fontColor,
          fontSize: style.axis?.fontSize || 11,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'hanging'
        });
      });
    }
  }

  /**
   * Animate lines drawing in
   */
  animate() {
    // Use simple fade-in for the whole chart
    const duration = this.config.style.animation?.duration || 600;
    if (this.renderer?.svg) {
      const children = this.renderer.svg.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        child.style.opacity = '0';
        child.style.transition = `opacity ${duration}ms ease-out`;
        setTimeout(() => {
          child.style.opacity = '1';
        }, i * 5);
      }
    }
  }
}

export default RangeChart;
