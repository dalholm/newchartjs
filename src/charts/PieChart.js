/**
 * Pie Chart implementation
 */

import Chart from '../core/Chart.js';
import { PIE_DEFAULTS } from '../core/defaults.js';
import { formatNumber, deepMerge } from '../core/utils.js';

export class PieChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(PIE_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Calculate pie slices
   */
  calculateSlices() {
    const { data, options, style } = this.config;
    const dataset = data.datasets[0];

    if (!dataset || !dataset.values) {
      return [];
    }

    const values = dataset.values;
    const total = values.reduce((sum, v) => sum + Math.abs(v), 0);

    if (total === 0) return [];

    const slices = [];
    const padding = options.padding || 20;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) / 2 - padding - 40;
    const radius = maxRadius;
    const innerRadius = style.pie?.innerRadius || 0;

    const startAngle = style.pie?.startAngle || -Math.PI / 2;
    const endAngle = style.pie?.endAngle || Math.PI * 1.5;
    const availableAngle = endAngle - startAngle;

    let currentAngle = startAngle;

    values.forEach((value, index) => {
      const sliceAngle = (Math.abs(value) / total) * availableAngle;
      const midAngle = currentAngle + sliceAngle / 2;

      const color = dataset.colors?.[index] || this.getPaletteColor(index);

      slices.push({
        index,
        value: Math.abs(value),
        percent: (Math.abs(value) / total) * 100,
        startAngle: currentAngle,
        endAngle: currentAngle + sliceAngle,
        midAngle,
        color,
        label: data.labels?.[index] || `Slice ${index + 1}`,
        centerX,
        centerY,
        radius,
        innerRadius
      });

      currentAngle += sliceAngle;
    });

    return slices;
  }

  /**
   * Render pie chart
   */
  render() {
    const { style, options } = this.config;
    const slices = this.calculateSlices();

    if (slices.length === 0) return;

    const borderWidth = style.pie?.borderWidth || 2;
    const borderColor = style.pie?.borderColor || '#ffffff';
    const labelPosition = options.labels?.position || 'outside';

    // Draw slices
    slices.forEach((slice) => {
      const sliceElement = this.renderer.arc(
        slice.centerX,
        slice.centerY,
        slice.radius,
        slice.startAngle,
        slice.endAngle,
        slice.innerRadius,
        {
          fill: slice.color,
          stroke: borderColor,
          strokeWidth: borderWidth,
          opacity: 0.85
        }
      );

      // Hover effect
      if (sliceElement) {
        sliceElement.style.cursor = 'pointer';

        this.addElementListener(sliceElement, 'mouseenter', (e) => {
          sliceElement.setAttribute('opacity', '1');
          this.showTooltip(e, {
            [slice.label]: formatNumber(slice.value, 0),
            'Percentage': formatNumber(slice.percent, 1) + '%'
          });
        });

        this.addElementListener(sliceElement, 'mouseleave', () => {
          sliceElement.setAttribute('opacity', '0.85');
        });
      }

      // Draw labels
      if (labelPosition !== 'none') {
        const labelDistance = labelPosition === 'inside'
          ? (slice.radius + slice.innerRadius) / 2
          : slice.radius + 20;

        const labelX = slice.centerX + labelDistance * Math.cos(slice.midAngle);
        const labelY = slice.centerY + labelDistance * Math.sin(slice.midAngle);

        const labelFormat = options.labels?.format || 'percent';
        let labelText;

        switch (labelFormat) {
          case 'value':
            labelText = formatNumber(slice.value, 0);
            break;
          case 'label':
            labelText = slice.label;
            break;
          case 'percent':
          default:
            labelText = formatNumber(slice.percent, 1) + '%';
        }

        this.renderer.text(labelText, labelX, labelY, {
          fill: style.fontColor,
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
          textAnchor: 'middle',
          dominantBaseline: 'middle'
        });
      }
    });

    this.slices = slices;
  }

  /**
   * Animate pie slices
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    const easing = this.config.style.animation?.easing || 'easeOutCubic';

    if (!this.slices || !this.slices.length) return;

    this.slices.forEach((slice, index) => {
      const delay = (index / this.slices.length) * (duration * 0.3);

      setTimeout(() => {
        this.animateValue({
          from: slice.startAngle,
          to: slice.endAngle,
          duration: duration,
          easing: easing,
          onUpdate: (endAngle) => {
            // Redraw with animated slice
            this.renderer.clear();

            // Redraw background
            if (this.config.style.background) {
              this.renderer.rect(0, 0, this.width, this.height, {
                fill: this.config.style.background
              });
            }

            const borderColor = this.config.style.pie?.borderColor || '#ffffff';
            const borderWidth = this.config.style.pie?.borderWidth || 2;
            const labelPosition = this.config.options.labels?.position || 'outside';
            const labelFormat = this.config.options.labels?.format || 'percent';

            // Redraw slices up to current animation
            this.slices.forEach((s, i) => {
              const drawEnd = i < index ? s.endAngle : (i === index ? endAngle : null);
              if (drawEnd === null) return;

              this.renderer.arc(
                s.centerX, s.centerY, s.radius,
                s.startAngle, drawEnd, s.innerRadius,
                { fill: s.color, stroke: borderColor, strokeWidth: borderWidth, opacity: 0.85 }
              );

              // Redraw label for completed slices
              if (i < index && labelPosition !== 'none') {
                const labelDistance = labelPosition === 'inside'
                  ? (s.radius + s.innerRadius) / 2
                  : s.radius + 20;
                const labelX = s.centerX + labelDistance * Math.cos(s.midAngle);
                const labelY = s.centerY + labelDistance * Math.sin(s.midAngle);

                let labelText;
                switch (labelFormat) {
                  case 'value': labelText = formatNumber(s.value, 0); break;
                  case 'label': labelText = s.label; break;
                  default: labelText = formatNumber(s.percent, 1) + '%';
                }

                this.renderer.text(labelText, labelX, labelY, {
                  fill: this.config.style.fontColor,
                  fontSize: this.config.style.fontSize,
                  fontFamily: this.config.style.fontFamily,
                  textAnchor: 'middle',
                  dominantBaseline: 'middle'
                });
              }
            });
          }
        });
      }, delay);
    });
  }
}

export default PieChart;
