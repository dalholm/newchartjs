/**
 * Gauge Chart implementation
 * Circular gauge with threshold zones, center value display, and optional target marker
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
   * Calculate gauge geometry
   * @returns {Object} Gauge layout parameters
   */
  calculateLayout() {
    const padding = this.config.options.padding || 20;
    const cx = this.width / 2;
    const cy = this.height * 0.55;
    const maxRadius = Math.min(this.width, this.height) / 2 - padding - 20;
    const radius = Math.max(maxRadius, 60);
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
  arcPath(cx, cy, outerR, innerR, startAngle, endAngle) {
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

    return [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
  }

  /**
   * Render gauge chart
   */
  render() {
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

    // Draw background track
    const trackColor = style.gauge?.trackColor || '#f1f3f5';
    this.renderer.path(
      this.arcPath(cx, cy, outerR, innerR, startAngle, endAngle),
      { fill: trackColor }
    );

    // Draw threshold zones
    zones.forEach(zone => {
      const zoneStart = startAngle + zone.from * sweep;
      const zoneEnd = startAngle + Math.min(zone.to, 1) * sweep;

      // Only draw zone portion that is filled by the current value
      const valueAngle = this.valueToAngle(value, min, max, startAngle, sweep);
      const drawEnd = Math.min(zoneEnd, valueAngle);

      if (drawEnd > zoneStart) {
        this.renderer.path(
          this.arcPath(cx, cy, outerR, innerR, zoneStart, drawEnd),
          { fill: zone.color, opacity: 1 }
        );
      }
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
          stroke: options.targetColor || '#1a1d23',
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
            fill: '#5e6c84',
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
        { fill: options.needleColor || '#1a1d23' }
      );

      // Center circle
      this.renderer.circle(cx, cy, 5, {
        fill: options.needleColor || '#1a1d23'
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
        fill: '#8993a4',
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
          fill: '#b3bac5',
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
   * Animate gauge needle sweep
   */
  animate() {
    const duration = this.config.style.animation?.duration || 800;
    const easing = this.config.style.animation?.easing || 'easeOutCubic';

    if (this._gaugeValue == null) return;

    const targetValue = this._gaugeValue;

    // Redraw with animated value
    this.animateValue({
      from: this.config.options.min ?? 0,
      to: targetValue,
      duration,
      easing,
      onUpdate: (currentValue) => {
        // Store original value, set animated value, re-render
        const origValues = this.config.data.datasets[0].values;
        this.config.data.datasets[0].values = [currentValue];

        this.renderer.clear();
        if (this.config.style.background) {
          this.renderer.rect(0, 0, this.width, this.height, { fill: this.config.style.background });
        }
        this.render();

        // Restore original
        this.config.data.datasets[0].values = origValues;
      }
    });
  }
}

export default GaugeChart;
