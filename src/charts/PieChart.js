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
    const innerRadius = slices[0]?.innerRadius || 0;
    const isDonut = innerRadius > 0;
    const total = slices.reduce((sum, s) => sum + s.value, 0);
    const cx = slices[0].centerX;
    const cy = slices[0].centerY;

    // Store slice elements for hover interaction
    this._sliceElements = [];

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
          opacity: 1
        }
      );

      this._sliceElements.push({ element: sliceElement, slice });

      // Hover effects: explode + dim others
      if (sliceElement) {
        sliceElement.style.cursor = 'pointer';
        sliceElement.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out, filter 0.15s ease-out';
        sliceElement.style.transformOrigin = `${cx}px ${cy}px`;

        this.addElementListener(sliceElement, 'mouseenter', (e) => {
          // Explode hovered slice outward
          const tx = Math.cos(slice.midAngle) * 5;
          const ty = Math.sin(slice.midAngle) * 5;
          sliceElement.style.transform = `translate(${tx}px, ${ty}px)`;
          sliceElement.style.filter = 'brightness(1.08)';
          sliceElement.setAttribute('opacity', '1');

          // Dim other slices
          this._sliceElements.forEach(({ element: el }) => {
            if (el !== sliceElement) {
              el.setAttribute('opacity', '0.35');
            }
          });

          // Update center text if donut
          if (isDonut && this._centerTextValue && this._centerTextLabel) {
            this._centerTextValue.textContent = formatNumber(slice.percent, 1) + '%';
            this._centerTextLabel.textContent = slice.label;
          }

          this.showTooltip(e, {
            [slice.label]: formatNumber(slice.value, 0),
            'Andel': formatNumber(slice.percent, 1) + '%'
          });

          if (typeof options.onHover === 'function') {
            options.onHover(slice.index, slice.label);
          }
        });

        this.addElementListener(sliceElement, 'mouseleave', () => {
          this._clearSliceHighlight();

          if (typeof options.onHoverEnd === 'function') {
            options.onHoverEnd();
          }
        });

        // Click callback
        this.addElementListener(sliceElement, 'click', (e) => {
          if (typeof options.onClick === 'function') {
            options.onClick({
              index: slice.index,
              label: slice.label,
              value: slice.value,
              percent: slice.percent,
              event: e
            });
          }
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

    // White center circle + center text for donut charts
    if (isDonut) {
      this.renderer.circle(cx, cy, innerRadius - 2, {
        fill: '#ffffff'
      });

      this._centerTextValue = this.renderer.text(formatNumber(total, 0), cx, cy - 3, {
        fill: style.fontColor || '#172b4d',
        fontSize: 16,
        fontFamily: style.monoFamily || style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fontWeight: 700
      });

      this._centerTextLabel = this.renderer.text('total', cx, cy + 14, {
        fill: '#8993a4',
        fontSize: 9,
        fontFamily: style.fontFamily,
        textAnchor: 'middle',
        dominantBaseline: 'middle'
      });
    }

    this.slices = slices;
  }

  /**
   * Programmatically highlight a slice by index
   * @param {number} index - Slice index to highlight
   */
  highlightSlice(index) {
    if (!this._sliceElements || !this.slices) return;
    const target = this._sliceElements[index];
    if (!target) return;

    const { style, options } = this.config;
    const innerRadius = this.slices[0]?.innerRadius || 0;
    const isDonut = innerRadius > 0;
    const total = this.slices.reduce((sum, s) => sum + s.value, 0);
    const slice = target.slice;

    // Explode target
    const tx = Math.cos(slice.midAngle) * 5;
    const ty = Math.sin(slice.midAngle) * 5;
    target.element.style.transform = `translate(${tx}px, ${ty}px)`;
    target.element.style.filter = 'brightness(1.08)';
    target.element.setAttribute('opacity', '1');

    // Dim others
    this._sliceElements.forEach(({ element: el }, i) => {
      if (i !== index) {
        el.setAttribute('opacity', '0.35');
      }
    });

    // Update center text
    if (isDonut && this._centerTextValue && this._centerTextLabel) {
      this._centerTextValue.textContent = formatNumber(slice.percent, 1) + '%';
      this._centerTextLabel.textContent = slice.label;
    }
  }

  /**
   * Clear all slice highlights
   */
  clearHighlight() {
    this._clearSliceHighlight();
  }

  /**
   * Internal: reset all slices to default state
   */
  _clearSliceHighlight() {
    const innerRadius = this.slices?.[0]?.innerRadius || 0;
    const isDonut = innerRadius > 0;
    const total = this.slices ? this.slices.reduce((sum, s) => sum + s.value, 0) : 0;

    if (this._sliceElements) {
      this._sliceElements.forEach(({ element: el }) => {
        el.style.transform = '';
        el.style.filter = '';
        el.setAttribute('opacity', '1');
      });
    }

    if (isDonut && this._centerTextValue && this._centerTextLabel) {
      this._centerTextValue.textContent = formatNumber(total, 0);
      this._centerTextLabel.textContent = 'total';
    }
  }

  /**
   * Animate pie slices with scale-in effect matching prototype
   * Each slice scales from 0→1 from the center with staggered delays
   * and a bounce easing curve.
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;

    if (!this.slices || !this.slices.length) return;
    if (!this._sliceElements || !this._sliceElements.length) return;

    const cx = this.slices[0].centerX;
    const cy = this.slices[0].centerY;

    // Set all slices to scale(0) initially
    this._sliceElements.forEach(({ element }) => {
      if (!element) return;
      element.style.transformOrigin = `${cx}px ${cy}px`;
      element.style.transform = 'scale(0)';
      // Use a bouncy cubic-bezier for the scale-in, with stagger delay
      element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    });

    // Stagger: trigger scale(1) per slice with increasing delay
    this._sliceElements.forEach(({ element }, i) => {
      if (!element) return;
      const delay = i * 40;
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, delay);
    });

    // After all animations complete, restore transition for hover effects
    const totalTime = duration + this._sliceElements.length * 40;
    setTimeout(() => {
      this._sliceElements.forEach(({ element }) => {
        if (!element) return;
        element.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out, filter 0.15s ease-out';
      });
    }, totalTime);
  }
}

export default PieChart;
