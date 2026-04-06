/**
 * Funnel Chart implementation
 * Visualizes conversion funnels with narrowing trapezoids
 */

import Chart from '../core/Chart.js';
import { FUNNEL_DEFAULTS } from '../core/defaults.js';
import { formatNumber, deepMerge } from '../core/utils.js';

export class FunnelChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(FUNNEL_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Calculate funnel stages with geometry
   * @returns {Array} Stage objects with positions and dimensions
   */
  calculateStages() {
    const { data, options, style } = this.config;
    const dataset = data.datasets[0];
    if (!dataset || !dataset.values) return [];

    const values = dataset.values;
    const maxValue = Math.max(...values);
    if (maxValue === 0) return [];

    const padding = options.padding || 20;
    const topSpace = options.legend?.enabled ? 40 : 10;
    const funnel = style.funnel || {};

    const chartX = padding + 80; // space for labels
    const chartY = topSpace + padding;
    const chartWidth = this.width - chartX - padding - 80; // space for value labels
    const chartHeight = this.height - chartY - padding;
    const gap = funnel.gap || 4;
    const stageHeight = (chartHeight - gap * (values.length - 1)) / values.length;
    const minWidth = funnel.minWidth || 0.15;

    const stages = [];

    values.forEach((value, i) => {
      const ratio = value / maxValue;
      const nextRatio = i < values.length - 1 ? values[i + 1] / maxValue : ratio * 0.7;
      const topWidth = Math.max(ratio, minWidth) * chartWidth;
      const bottomWidth = Math.max(i < values.length - 1 ? nextRatio : ratio * 0.7, minWidth) * chartWidth;

      const y = chartY + i * (stageHeight + gap);
      const topX = chartX + (chartWidth - topWidth) / 2;
      const bottomX = chartX + (chartWidth - bottomWidth) / 2;

      const dropOff = i > 0 ? ((values[i - 1] - value) / values[i - 1] * 100) : 0;
      const conversionRate = (value / values[0] * 100);

      const color = dataset.colors?.[i] || this.getPaletteColor(i);

      stages.push({
        index: i,
        value,
        label: data.labels?.[i] || `Stage ${i + 1}`,
        color,
        topX,
        topWidth,
        bottomX,
        bottomWidth,
        y,
        height: stageHeight,
        dropOff,
        conversionRate,
        centerX: chartX + chartWidth / 2,
        centerY: y + stageHeight / 2
      });
    });

    return stages;
  }

  /**
   * Render funnel chart
   */
  render() {
    const { style, options } = this.config;
    const stages = this.calculateStages();
    if (stages.length === 0) return;

    this._stageElements = [];

    stages.forEach((stage) => {
      // Draw trapezoid as a path
      const d = `M ${stage.topX} ${stage.y}`
        + ` L ${stage.topX + stage.topWidth} ${stage.y}`
        + ` L ${stage.bottomX + stage.bottomWidth} ${stage.y + stage.height}`
        + ` L ${stage.bottomX} ${stage.y + stage.height}`
        + ` Z`;

      const el = this.renderer.path(d, {
        fill: stage.color,
        stroke: style.background || '#ffffff',
        strokeWidth: 1
      });

      this._stageElements.push({ element: el, stage });

      if (el) {
        el.style.cursor = 'pointer';
        el.style.transition = 'opacity 0.15s ease-out, filter 0.15s ease-out';

        this.addElementListener(el, 'mouseenter', (e) => {
          this._stageElements.forEach(({ element: other }) => {
            if (other !== el) other.setAttribute('opacity', '0.35');
          });
          el.style.filter = 'brightness(1.08)';

          const tooltipData = {
            [stage.label]: formatNumber(stage.value, 0)
          };
          if (stage.index > 0) {
            tooltipData['Drop-off'] = formatNumber(stage.dropOff, 1) + '%';
          }
          tooltipData['Conversion'] = formatNumber(stage.conversionRate, 1) + '%';

          this.showTooltip(e, tooltipData);

          if (typeof options.onHover === 'function') {
            options.onHover(stage.index, stage.label);
          }
        });

        this.addElementListener(el, 'mouseleave', () => {
          this._stageElements.forEach(({ element: other }) => {
            other.setAttribute('opacity', '1');
            other.style.filter = '';
          });

          if (typeof options.onHoverEnd === 'function') {
            options.onHoverEnd();
          }
        });

        this.addElementListener(el, 'click', (e) => {
          if (typeof options.onClick === 'function') {
            options.onClick({
              index: stage.index,
              label: stage.label,
              value: stage.value,
              conversionRate: stage.conversionRate,
              dropOff: stage.dropOff,
              event: e
            });
          }
        });
      }

      // Left label
      this.renderer.text(stage.label, stage.topX - 10, stage.centerY, {
        fill: style.fontColor,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        textAnchor: 'end',
        dominantBaseline: 'middle'
      });

      // Right value + conversion
      const valueText = formatNumber(stage.value, 0);
      const convText = stage.index > 0
        ? ` (${formatNumber(stage.conversionRate, 1)}%)`
        : '';

      this.renderer.text(valueText + convText, stage.topX + stage.topWidth + 10, stage.centerY, {
        fill: style.fontColor,
        fontSize: style.fontSize,
        fontFamily: style.monoFamily || style.fontFamily,
        textAnchor: 'start',
        dominantBaseline: 'middle'
      });

      // Drop-off arrow between stages
      if (stage.index > 0) {
        const prevStage = stages[stage.index - 1];
        const arrowY = stage.y - 2;
        const arrowX = stage.topX + stage.topWidth + 10;

        this.renderer.text(
          `▾ −${formatNumber(stage.dropOff, 1)}%`,
          stage.centerX + stage.topWidth / 2 + 50,
          prevStage.y + prevStage.height + 1,
          {
            fill: '#e03131',
            fontSize: 9,
            fontFamily: style.monoFamily || style.fontFamily,
            textAnchor: 'start',
            dominantBaseline: 'hanging'
          }
        );
      }
    });

    this.stages = stages;
  }

  /**
   * Animate funnel stages with slide-in effect
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    if (!this._stageElements?.length) return;

    this._stageElements.forEach(({ element }, i) => {
      if (!element) return;
      element.style.opacity = '0';
      element.style.transform = 'translateX(-20px)';
      element.style.transition = `opacity ${duration * 0.6}ms ease-out, transform ${duration * 0.6}ms ease-out`;

      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateX(0)';
      }, i * 60);
    });

    const totalTime = duration + this._stageElements.length * 60;
    setTimeout(() => {
      this._stageElements.forEach(({ element }) => {
        if (!element) return;
        element.style.transition = 'opacity 0.15s ease-out, filter 0.15s ease-out';
      });
    }, totalTime);
  }
}

export default FunnelChart;
