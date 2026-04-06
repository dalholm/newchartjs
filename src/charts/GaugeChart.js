/**
 * Gauge Chart implementation
 * Circular gauge with threshold zones, center value display, and optional target marker
 * Supports variants: arc (default), ring, linear, compact
 */

import Chart from '../core/Chart.js';
import { GAUGE_DEFAULTS } from '../core/defaults.js';
import { formatNumber, deepMerge } from '../core/utils.js';

export class GaugeChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(GAUGE_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Calculate gauge geometry optimized for semicircular arc
   * @returns {Object} Gauge layout parameters
   */
  calculateLayout() {
    const padding = this.config.options.padding || 20;
    const hasNeedle = this.config.style.gauge?.needle !== false;
    const hasTicks = (this.config.options.ticks ?? 5) > 0;

    // Space needed outside the arc for tick marks and labels
    const tickMargin = hasTicks ? 35 : 8;
    // Space below center for value text, label, and "av X" sub-label
    const textBelow = hasNeedle ? 75 : 50;

    // Width constraint: arc diameter + tick labels on each side
    const maxRW = (this.width - 2 * padding) / 2 - tickMargin;

    // Height constraints for a 270° arc:
    // - Above center: radius extends to arc top, plus tick margin
    // - Below center: arc endpoints at 0.707*r, plus text below center
    // Constraint 1: padding + tickMargin + radius + 0.707*radius ≤ height - padding
    const rFromArc = (this.height - 2 * padding - tickMargin) / 1.707;
    // Constraint 2: padding + tickMargin + radius + textBelow ≤ height - padding
    const rFromText = this.height - 2 * padding - tickMargin - textBelow;

    const radius = Math.max(Math.min(maxRW, rFromArc, rFromText), 60);

    // Position center so the gauge is vertically centered in available space
    const cx = this.width / 2;
    const contentTop = padding + tickMargin + radius;
    const contentBottom = Math.max(0.707 * radius, textBelow);
    const totalContent = radius + tickMargin + contentBottom;
    const cy = padding + tickMargin + radius + (this.height - 2 * padding - totalContent) / 2;

    const arcWidth = this.config.style.gauge?.arcWidth || radius * 0.18;

    return { cx, cy, radius, arcWidth, padding };
  }

  /**
   * Convert a value to an angle on the gauge arc
   * @param {number} value - Data value
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} startAngle - Arc start angle (radians)
   * @param {number} sweep - Arc sweep angle (radians)
   * @returns {number} Angle in radians
   */
  valueToAngle(value, min, max, startAngle, sweep) {
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return startAngle + ratio * sweep;
  }

  /**
   * Build an SVG arc path
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} outerR - Outer radius
   * @param {number} innerR - Inner radius
   * @param {number} startAngle - Start angle (radians)
   * @param {number} endAngle - End angle (radians)
   * @returns {string} SVG path data
   */
  arcPath(cx, cy, outerR, innerR, startAngle, endAngle, { roundStart = false, roundEnd = false } = {}) {
    const cos = Math.cos;
    const sin = Math.sin;

    const x1 = cx + outerR * cos(startAngle);
    const y1 = cy + outerR * sin(startAngle);
    const x2 = cx + outerR * cos(endAngle);
    const y2 = cy + outerR * sin(endAngle);
    const x3 = cx + innerR * cos(endAngle);
    const y3 = cy + innerR * sin(endAngle);
    const x4 = cx + innerR * cos(startAngle);
    const y4 = cy + innerR * sin(startAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const capR = (outerR - innerR) / 2;

    return [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      roundEnd
        ? `A ${capR} ${capR} 0 0 1 ${x3} ${y3}`
        : `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      roundStart
        ? `A ${capR} ${capR} 0 0 1 ${x1} ${y1}`
        : 'Z'
    ].join(' ');
  }

  /**
   * Dispatch render to variant-specific method
   */
  render() {
    const variant = this.config.options.variant || 'arc';

    switch (variant) {
      case 'ring':
        this.renderRing();
        break;
      case 'linear':
        this.renderLinear();
        break;
      case 'compact':
        this.renderCompact();
        break;
      default:
        this.renderArc();
        break;
    }
  }

  /**
   * Render classic semicircular arc gauge (default)
   */
  renderArc() {
    const { style, data, options } = this.config;
    const { cx, cy, radius, arcWidth } = this.calculateLayout();

    const dataset = data.datasets[0];
    if (!dataset) return;

    const value = dataset.values?.[0] ?? 0;
    const min = options.min ?? 0;
    const max = options.max ?? 100;
    const target = options.target;

    // Arc geometry — 240 degree sweep, centered at bottom
    const startAngle = options.startAngle ?? (Math.PI * 0.75);
    const sweep = options.sweep ?? (Math.PI * 1.5);
    const endAngle = startAngle + sweep;

    const outerR = radius;
    const innerR = radius - arcWidth;

    // Threshold zones
    const zones = options.zones || style.gauge?.zones || [
      { from: 0, to: 0.6, color: '#e03131' },
      { from: 0.6, to: 0.85, color: '#f08c00' },
      { from: 0.85, to: 1.0, color: '#0ca678' }
    ];

    const roundedEnds = style.gauge?.roundedEnds === true;

    // Draw background track
    const trackColor = style.gauge?.trackColor || '#f1f3f5';
    this.renderer.path(
      this.arcPath(cx, cy, outerR, innerR, startAngle, endAngle, {
        roundStart: roundedEnds, roundEnd: roundedEnds
      }),
      { fill: trackColor }
    );

    // Draw threshold zones
    const valueAngle = this.valueToAngle(value, min, max, startAngle, sweep);
    const visibleZones = [];
    zones.forEach(zone => {
      const zoneStart = startAngle + zone.from * sweep;
      const zoneEnd = startAngle + Math.min(zone.to, 1) * sweep;
      const drawEnd = Math.min(zoneEnd, valueAngle);

      if (drawEnd > zoneStart) {
        visibleZones.push({ start: zoneStart, end: drawEnd, color: zone.color });
      }
    });

    visibleZones.forEach((vz, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === visibleZones.length - 1;
      this.renderer.path(
        this.arcPath(cx, cy, outerR, innerR, vz.start, vz.end, {
          roundStart: roundedEnds && isFirst,
          roundEnd: roundedEnds && isLast
        }),
        { fill: vz.color, opacity: 1 }
      );
    });

    // Draw tick marks
    const ticks = options.ticks ?? 5;
    if (ticks > 0) {
      for (let i = 0; i <= ticks; i++) {
        const ratio = i / ticks;
        const angle = startAngle + ratio * sweep;
        const tickValue = min + ratio * (max - min);

        // Tick line
        const tickOuterR = outerR + 4;
        const tickInnerR = outerR + 10;
        this.renderer.line(
          cx + tickOuterR * Math.cos(angle), cy + tickOuterR * Math.sin(angle),
          cx + tickInnerR * Math.cos(angle), cy + tickInnerR * Math.sin(angle),
          { stroke: style.axis?.color || '#8993a4', strokeWidth: 1.5 }
        );

        // Tick label
        const labelR = outerR + 22;
        this.renderer.text(
          formatNumber(tickValue, 0),
          cx + labelR * Math.cos(angle),
          cy + labelR * Math.sin(angle),
          {
            fill: style.axis?.color || '#8993a4',
            fontSize: style.gauge?.tickFontSize || 10,
            fontFamily: style.fontFamily,
            textAnchor: 'middle',
            dominantBaseline: 'middle'
          }
        );
      }
    }

    // Draw target marker
    if (target != null) {
      const targetAngle = this.valueToAngle(target, min, max, startAngle, sweep);
      const markerOuterR = outerR + 2;
      const markerInnerR = innerR - 2;

      this.renderer.line(
        cx + markerOuterR * Math.cos(targetAngle), cy + markerOuterR * Math.sin(targetAngle),
        cx + markerInnerR * Math.cos(targetAngle), cy + markerInnerR * Math.sin(targetAngle),
        {
          stroke: options.targetColor || style.fontColor || '#1a1d23',
          strokeWidth: 2.5,
          strokeLinecap: 'round'
        }
      );

      // Target label
      if (options.targetLabel !== false) {
        const targetLabelR = outerR + 32;
        this.renderer.text(
          options.targetLabel || `Mal: ${formatNumber(target, 0)}`,
          cx + targetLabelR * Math.cos(targetAngle),
          cy + targetLabelR * Math.sin(targetAngle),
          {
            fill: style.fontColor || '#5e6c84',
            fontSize: 9,
            fontFamily: style.fontFamily,
            textAnchor: 'middle',
            dominantBaseline: 'middle'
          }
        );
      }
    }

    // Needle
    if (style.gauge?.needle !== false) {
      const needleAngle = this.valueToAngle(value, min, max, startAngle, sweep);
      const needleLength = innerR - 8;
      const needleWidth = 3;

      // Needle path (triangle from center to value)
      const nx = cx + needleLength * Math.cos(needleAngle);
      const ny = cy + needleLength * Math.sin(needleAngle);
      const nlx = cx + needleWidth * Math.cos(needleAngle - Math.PI / 2);
      const nly = cy + needleWidth * Math.sin(needleAngle - Math.PI / 2);
      const nrx = cx + needleWidth * Math.cos(needleAngle + Math.PI / 2);
      const nry = cy + needleWidth * Math.sin(needleAngle + Math.PI / 2);

      this.renderer.path(
        `M ${nx} ${ny} L ${nlx} ${nly} L ${nrx} ${nry} Z`,
        { fill: options.needleColor || style.fontColor || '#1a1d23' }
      );

      // Center circle
      this.renderer.circle(cx, cy, 5, {
        fill: options.needleColor || style.fontColor || '#1a1d23'
      });
    }

    // Center value text
    const valueColor = this.getValueColor(value, min, max, zones);

    this._centerValue = this.renderer.text(
      this.formatValue(value),
      cx, cy + (style.gauge?.needle !== false ? 28 : 0),
      {
        fill: valueColor,
        fontSize: style.gauge?.valueFontSize || 28,
        fontFamily: style.monoFamily || style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'middle'
      }
    );

    // Label text
    const label = dataset.label || data.labels?.[0] || '';
    if (label) {
      this.renderer.text(label, cx, cy + (style.gauge?.needle !== false ? 48 : 22), {
        fill: style.axis?.color || '#8993a4',
        fontSize: 11,
        fontFamily: style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'middle'
      });
    }

    // Sub-label (e.g., "av 100")
    if (options.showMax !== false) {
      this.renderer.text(
        `av ${formatNumber(max, 0)}`,
        cx, cy + (style.gauge?.needle !== false ? 62 : 36),
        {
          fill: style.grid?.color || '#b3bac5',
          fontSize: 9,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        }
      );
    }

    this._gaugeValue = value;
  }

  /**
   * Render ring gauge — full 360° donut with center value
   */
  renderRing() {
    const { style, data, options } = this.config;
    const padding = this.config.options.padding || 20;

    const dataset = data.datasets[0];
    if (!dataset) return;

    const value = dataset.values?.[0] ?? 0;
    const min = options.min ?? 0;
    const max = options.max ?? 100;
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

    const cx = this.width / 2;
    const cy = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) / 2 - padding;
    const ringWidth = style.gauge?.arcWidth || Math.max(maxRadius * 0.2, 8);
    const outerR = maxRadius;
    const innerR = outerR - ringWidth;

    const zones = options.zones || style.gauge?.zones || [
      { from: 0, to: 0.6, color: '#e03131' },
      { from: 0.6, to: 0.85, color: '#f08c00' },
      { from: 0.85, to: 1.0, color: '#0ca678' }
    ];

    const trackColor = style.gauge?.trackColor || '#f1f3f5';
    const roundedEnds = style.gauge?.roundedEnds === true;
    const startAngle = -Math.PI / 2;
    const sweep = Math.PI * 2;

    // Background track — full circle (never rounded, it's a closed ring)
    this.renderer.path(
      this.arcPath(cx, cy, outerR, innerR, startAngle, startAngle + sweep - 0.001),
      { fill: trackColor }
    );

    // Filled arc with zone colors
    if (ratio > 0) {
      const valueEnd = startAngle + ratio * sweep;
      const visibleZones = [];
      zones.forEach(zone => {
        const zoneStart = startAngle + zone.from * sweep;
        const zoneEnd = startAngle + Math.min(zone.to, 1) * sweep;
        const drawEnd = Math.min(zoneEnd, valueEnd);

        if (drawEnd > zoneStart) {
          visibleZones.push({ start: zoneStart, end: drawEnd, color: zone.color });
        }
      });

      visibleZones.forEach((vz, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === visibleZones.length - 1;
        this.renderer.path(
          this.arcPath(cx, cy, outerR, innerR, vz.start, vz.end, {
            roundStart: roundedEnds && isFirst,
            roundEnd: roundedEnds && isLast
          }),
          { fill: vz.color }
        );
      });
    }

    // Center value
    const valueColor = this.getValueColor(value, min, max, zones);
    this.renderer.text(
      this.formatValue(value),
      cx, cy - 4,
      {
        fill: valueColor,
        fontSize: style.gauge?.valueFontSize || 28,
        fontFamily: style.monoFamily || style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'middle'
      }
    );

    // Label
    const label = dataset.label || data.labels?.[0] || '';
    if (label) {
      this.renderer.text(label, cx, cy + 18, {
        fill: style.axis?.color || '#8993a4',
        fontSize: 11,
        fontFamily: style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'middle'
      });
    }

    this._gaugeValue = value;
  }

  /**
   * Render linear gauge — horizontal progress bar with zones
   */
  renderLinear() {
    const { style, data, options } = this.config;
    const padding = this.config.options.padding || 20;

    const dataset = data.datasets[0];
    if (!dataset) return;

    const value = dataset.values?.[0] ?? 0;
    const min = options.min ?? 0;
    const max = options.max ?? 100;
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const target = options.target;

    const zones = options.zones || style.gauge?.zones || [
      { from: 0, to: 0.6, color: '#e03131' },
      { from: 0.6, to: 0.85, color: '#f08c00' },
      { from: 0.85, to: 1.0, color: '#0ca678' }
    ];

    const trackColor = style.gauge?.trackColor || '#f1f3f5';
    const barHeight = style.gauge?.arcWidth || 16;
    const borderRadius = barHeight / 2;

    // Layout: value text on top, bar in center, labels below
    const barX = padding;
    const barWidth = this.width - 2 * padding;
    const barY = this.height / 2 - barHeight / 2 + 10;

    // Background track
    this.renderer.rect(barX, barY, barWidth, barHeight, {
      fill: trackColor,
      borderRadius
    });

    // Filled zones up to current value
    if (ratio > 0) {
      const fillWidth = barWidth * ratio;

      // Clip zones to filled width using individual rects
      zones.forEach(zone => {
        const zoneStartX = barX + zone.from * barWidth;
        const zoneEndX = barX + Math.min(zone.to, 1) * barWidth;
        const drawEndX = Math.min(zoneEndX, barX + fillWidth);

        if (drawEndX > zoneStartX) {
          const zoneWidth = drawEndX - zoneStartX;
          // Apply border radius only on edges
          const isFirst = zone.from === 0;
          const isLast = drawEndX >= barX + fillWidth - 0.5;

          this.renderer.rect(zoneStartX, barY, zoneWidth, barHeight, {
            fill: zone.color,
            borderRadius: isFirst && isLast ? borderRadius
              : isFirst ? `${borderRadius}px 0 0 ${borderRadius}px`
              : isLast ? `0 ${borderRadius}px ${borderRadius}px 0`
              : 0
          });
        }
      });
    }

    // Target marker
    if (target != null) {
      const targetRatio = Math.max(0, Math.min(1, (target - min) / (max - min)));
      const targetX = barX + targetRatio * barWidth;
      this.renderer.line(
        targetX, barY - 4,
        targetX, barY + barHeight + 4,
        {
          stroke: options.targetColor || style.fontColor || '#1a1d23',
          strokeWidth: 2,
          strokeLinecap: 'round'
        }
      );
      // Target label below bar
      this.renderer.text(
        options.targetLabel || formatNumber(target, 0),
        targetX, barY + barHeight + 18,
        {
          fill: style.fontColor || '#5e6c84',
          fontSize: 9,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        }
      );
    }

    // Value text above bar
    const valueColor = this.getValueColor(value, min, max, zones);
    this.renderer.text(
      this.formatValue(value),
      this.width / 2, barY - 18,
      {
        fill: valueColor,
        fontSize: style.gauge?.valueFontSize || 24,
        fontFamily: style.monoFamily || style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'middle'
      }
    );

    // Label
    const label = dataset.label || data.labels?.[0] || '';
    if (label) {
      this.renderer.text(label, this.width / 2, barY - 38, {
        fill: style.axis?.color || '#8993a4',
        fontSize: 11,
        fontFamily: style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'middle'
      });
    }

    // Min/max labels
    this.renderer.text(formatNumber(min, 0), barX, barY + barHeight + 14, {
      fill: style.grid?.color || '#b3bac5',
      fontSize: 9,
      fontFamily: style.fontFamily,
      textAnchor: 'start',
      dominantBaseline: 'middle'
    });
    this.renderer.text(formatNumber(max, 0), barX + barWidth, barY + barHeight + 14, {
      fill: style.grid?.color || '#b3bac5',
      fontSize: 9,
      fontFamily: style.fontFamily,
      textAnchor: 'end',
      dominantBaseline: 'middle'
    });

    this._gaugeValue = value;
  }

  /**
   * Render compact gauge — minimal semicircular arc, no needle/ticks
   */
  renderCompact() {
    const { style, data, options } = this.config;
    const padding = this.config.options.padding || 16;

    const dataset = data.datasets[0];
    if (!dataset) return;

    const value = dataset.values?.[0] ?? 0;
    const min = options.min ?? 0;
    const max = options.max ?? 100;

    const zones = options.zones || style.gauge?.zones || [
      { from: 0, to: 0.6, color: '#e03131' },
      { from: 0.6, to: 0.85, color: '#f08c00' },
      { from: 0.85, to: 1.0, color: '#0ca678' }
    ];

    const trackColor = style.gauge?.trackColor || '#f1f3f5';
    const roundedEnds = style.gauge?.roundedEnds === true;
    const labelPosition = options.labelPosition || 'below';

    // Arc geometry — 180 degree sweep (semicircle)
    const startAngle = Math.PI;
    const sweep = Math.PI;

    const cx = this.width / 2;
    // Fit semicircle: radius constrained by width and height
    const maxRadiusW = (this.width - 2 * padding) / 2;
    const maxRadiusH = this.height - 2 * padding - 40; // leave room for text below
    const radius = Math.max(Math.min(maxRadiusW, maxRadiusH), 30);
    const arcWidth = style.gauge?.arcWidth || Math.max(radius * 0.25, 10);
    const cy = padding + radius + 4;

    const outerR = radius;
    const innerR = radius - arcWidth;

    // Background track
    this.renderer.path(
      this.arcPath(cx, cy, outerR, innerR, startAngle, startAngle + sweep, {
        roundStart: roundedEnds, roundEnd: roundedEnds
      }),
      { fill: trackColor }
    );

    // Filled arc with zone colors
    const valueAngle = this.valueToAngle(value, min, max, startAngle, sweep);
    const visibleZones = [];
    zones.forEach(zone => {
      const zoneStart = startAngle + zone.from * sweep;
      const zoneEnd = startAngle + Math.min(zone.to, 1) * sweep;
      const drawEnd = Math.min(zoneEnd, valueAngle);

      if (drawEnd > zoneStart) {
        visibleZones.push({ start: zoneStart, end: drawEnd, color: zone.color });
      }
    });

    visibleZones.forEach((vz, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === visibleZones.length - 1;
      this.renderer.path(
        this.arcPath(cx, cy, outerR, innerR, vz.start, vz.end, {
          roundStart: roundedEnds && isFirst,
          roundEnd: roundedEnds && isLast
        }),
        { fill: vz.color }
      );
    });

    // Value and label positioning
    const valueColor = this.getValueColor(value, min, max, zones);
    const isInside = labelPosition === 'inside';

    // Value text
    this.renderer.text(
      this.formatValue(value),
      cx, isInside ? cy - radius * 0.35 : cy + 8,
      {
        fill: valueColor,
        fontSize: style.gauge?.valueFontSize || 24,
        fontFamily: style.monoFamily || style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'middle'
      }
    );

    // Label
    const label = dataset.label || data.labels?.[0] || '';
    if (label) {
      this.renderer.text(label, cx, isInside ? cy - radius * 0.35 + 20 : cy + 28, {
        fill: style.axis?.color || '#8993a4',
        fontSize: 11,
        fontFamily: style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'middle'
      });
    }

    this._gaugeValue = value;
  }

  /**
   * Get color based on value position within zones
   * @param {number} value - Current value
   * @param {number} min - Min value
   * @param {number} max - Max value
   * @param {Array} zones - Threshold zones
   * @returns {string} Color hex
   */
  getValueColor(value, min, max, zones) {
    const ratio = (value - min) / (max - min);
    for (let i = zones.length - 1; i >= 0; i--) {
      if (ratio >= zones[i].from) return zones[i].color;
    }
    return zones[0]?.color || '#374151';
  }

  /**
   * Format the center value display
   * @param {number} value - Value to format
   * @returns {string} Formatted string
   */
  formatValue(value) {
    const formatter = this.config.options.formatValue;
    if (typeof formatter === 'function') return formatter(value);

    const suffix = this.config.options.valueSuffix || '';
    const prefix = this.config.options.valuePrefix || '';
    return prefix + formatNumber(value, this.config.options.valueDecimals ?? 0) + suffix;
  }

  /**
   * Animate gauge value sweep
   */
  animate() {
    const duration = this.config.style.animation?.duration || 800;
    const easing = this.config.style.animation?.easing || 'easeOutCubic';

    if (this._gaugeValue == null) return;

    const targetValue = this._gaugeValue;
    const origValues = this.config.data.datasets[0].values;

    // Redraw with animated value — guard against re-entrant animate()
    this._isAnimatingGauge = true;

    this.animateValue({
      from: this.config.options.min ?? 0,
      to: targetValue,
      duration,
      easing,
      onUpdate: (currentValue) => {
        this.config.data.datasets[0].values = [currentValue];

        this.renderer.clear();
        if (this.config.style.background) {
          this.renderer.rect(0, 0, this.width, this.height, { fill: this.config.style.background });
        }
        // Call variant render directly, bypassing draw() lifecycle
        const variant = this.config.options.variant || 'arc';
        switch (variant) {
          case 'ring': this.renderRing(); break;
          case 'linear': this.renderLinear(); break;
          case 'compact': this.renderCompact(); break;
          default: this.renderArc(); break;
        }
      },
      onComplete: () => {
        // Restore original values
        this.config.data.datasets[0].values = origValues;
        this._isAnimatingGauge = false;
      }
    });
  }
}

export default GaugeChart;
