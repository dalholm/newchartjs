/**
 * Bullet Chart implementation
 * Stephen Few's bullet graph: actual vs target with qualitative ranges
 */

import Chart from '../core/Chart.js';
import { BULLET_DEFAULTS } from '../core/defaults.js';
import { formatNumber, deepMerge } from '../core/utils.js';

export class BulletChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(BULLET_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Render bullet chart (supports multiple bullets stacked vertically)
   */
  render() {
    const { data, style, options } = this.config;
    if (!data.datasets?.length) return;

    const bullet = style.bullet || {};
    const padding = options.padding || 20;
    const topSpace = options.legend?.enabled ? 40 : 10;

    const labelWidth = bullet.labelWidth || 120;
    const valueWidth = 60;
    const chartX = padding + labelWidth;
    const chartY = topSpace + padding;
    const chartWidth = this.width - chartX - padding - valueWidth;
    const chartHeight = this.height - chartY - padding;

    const bulletCount = data.datasets.length;
    const bulletHeight = Math.min(
      (chartHeight - (bulletCount - 1) * (bullet.gap || 16)) / bulletCount,
      bullet.maxHeight || 50
    );
    const bulletGap = bullet.gap || 16;

    this._bulletElements = [];

    data.datasets.forEach((dataset, i) => {
      if (!this.isDatasetVisible(dataset, i)) return;

      const y = chartY + i * (bulletHeight + bulletGap);
      const actual = dataset.value || 0;
      const target = dataset.target || 0;
      const min = dataset.min || options.min || 0;
      const max = dataset.max || options.max || Math.max(actual, target) * 1.2;
      const ranges = dataset.ranges || options.ranges || [
        { to: max * 0.6, color: bullet.rangePoor || '#f1f3f5' },
        { to: max * 0.85, color: bullet.rangeOk || '#dee2e6' },
        { to: max, color: bullet.rangeGood || '#ced4da' }
      ];

      const scaleX = (val) => chartX + ((val - min) / (max - min)) * chartWidth;

      // Label
      const label = dataset.label || `Metric ${i + 1}`;
      const subtitle = dataset.subtitle || '';

      this.renderer.text(label, chartX - 10, y + bulletHeight / 2 - (subtitle ? 5 : 0), {
        fill: style.fontColor,
        fontSize: style.fontSize || 12,
        fontFamily: style.fontFamily,
        textAnchor: 'end',
        dominantBaseline: 'middle',
        fontWeight: 600
      });

      if (subtitle) {
        this.renderer.text(subtitle, chartX - 10, y + bulletHeight / 2 + 10, {
          fill: style.axis?.color || '#6b7280',
          fontSize: 10,
          fontFamily: style.fontFamily,
          textAnchor: 'end',
          dominantBaseline: 'middle'
        });
      }

      // Qualitative ranges (background bands)
      let prevTo = min;
      ranges.forEach((range) => {
        const x1 = scaleX(prevTo);
        const x2 = scaleX(Math.min(range.to, max));
        this.renderer.rect(x1, y, x2 - x1, bulletHeight, {
          fill: range.color,
          borderRadius: 2
        });
        prevTo = range.to;
      });

      // Actual value bar (narrower, centered)
      const barHeight = bulletHeight * 0.45;
      const barY = y + (bulletHeight - barHeight) / 2;
      const barWidth = Math.max(scaleX(actual) - chartX, 0);
      const color = dataset.color || this.getPaletteColor(i);

      const barEl = this.renderer.rect(chartX, barY, barWidth, barHeight, {
        fill: color,
        borderRadius: 2
      });

      this._bulletElements.push({ element: barEl, dataset, index: i });

      // Target marker (thin vertical line)
      if (target > 0) {
        const targetX = scaleX(target);
        const markerHeight = bulletHeight * 0.7;
        const markerY = y + (bulletHeight - markerHeight) / 2;

        this.renderer.line(targetX, markerY, targetX, markerY + markerHeight, {
          stroke: bullet.targetColor || '#1a1d23',
          strokeWidth: 2.5
        });
      }

      // Comparative marker (previous period)
      if (dataset.comparative !== undefined) {
        const compX = scaleX(dataset.comparative);
        const compHeight = bulletHeight * 0.35;
        const compY = y + (bulletHeight - compHeight) / 2;

        this.renderer.rect(compX - 1.5, compY, 3, compHeight, {
          fill: bullet.comparativeColor || '#6b7280'
        });
      }

      // Value text on right
      this.renderer.text(formatNumber(actual, options.valueDecimals || 0), chartX + chartWidth + 10, y + bulletHeight / 2, {
        fill: style.fontColor,
        fontSize: 12,
        fontFamily: style.monoFamily || style.fontFamily,
        textAnchor: 'start',
        dominantBaseline: 'middle',
        fontWeight: 700
      });

      // Hover
      if (barEl) {
        barEl.style.cursor = 'pointer';
        barEl.style.transition = 'filter 0.15s ease-out';

        this.addElementListener(barEl, 'mouseenter', (e) => {
          barEl.style.filter = 'brightness(1.1)';

          const tooltipData = {
            [label]: formatNumber(actual, 0),
            'Target': formatNumber(target, 0),
            'Achievement': formatNumber((actual / target) * 100, 1) + '%'
          };
          if (dataset.comparative !== undefined) {
            tooltipData['Previous'] = formatNumber(dataset.comparative, 0);
          }
          this.showTooltip(e, tooltipData);
        });

        this.addElementListener(barEl, 'mouseleave', () => {
          barEl.style.filter = '';
        });
      }
    });
  }

  /**
   * Animate bars growing from left
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    if (!this._bulletElements?.length) return;

    this._bulletElements.forEach(({ element }, i) => {
      if (!element) return;
      element.style.transform = 'scaleX(0)';
      element.style.transformOrigin = 'left';
      element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.2, 0.64, 1)`;

      setTimeout(() => {
        element.style.transform = 'scaleX(1)';
      }, i * 80);
    });
  }
}

export default BulletChart;
