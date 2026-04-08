/**
 * Treemap Chart implementation
 * Nested rectangles showing hierarchical data with squarified layout
 */

import Chart from '../core/Chart.js';
import { TREEMAP_DEFAULTS } from '../core/defaults.js';
import { deepMerge } from '../core/utils.js';

export class TreemapChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(TREEMAP_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Squarified treemap layout algorithm
   * @param {Array} items - Items with .value
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} w - Width
   * @param {number} h - Height
   * @returns {Array} Items with x, y, width, height
   */
  squarify(items, x, y, w, h) {
    if (!items.length) return [];

    const total = items.reduce((s, it) => s + it.value, 0);
    if (total === 0) return [];

    const results = [];
    const sorted = [...items].sort((a, b) => b.value - a.value);

    let remaining = [...sorted];
    let cx = x, cy = y, cw = w, ch = h;

    while (remaining.length > 0) {
      const isWide = cw >= ch;
      const side = isWide ? ch : cw;
      const totalRemaining = remaining.reduce((s, it) => s + it.value, 0);

      // Find the best row
      let row = [remaining[0]];
      let rowTotal = remaining[0].value;

      for (let i = 1; i < remaining.length; i++) {
        const newRow = [...row, remaining[i]];
        const newTotal = rowTotal + remaining[i].value;

        if (this._worstRatio(newRow, newTotal, side, totalRemaining, cw * ch) <=
            this._worstRatio(row, rowTotal, side, totalRemaining, cw * ch)) {
          row = newRow;
          rowTotal = newTotal;
        } else {
          break;
        }
      }

      // Layout the row
      const rowFraction = rowTotal / totalRemaining;
      const rowSize = isWide ? cw * rowFraction : ch * rowFraction;

      let offset = 0;
      row.forEach(item => {
        const fraction = item.value / rowTotal;
        const itemSize = side * fraction;

        if (isWide) {
          results.push({
            ...item,
            x: cx,
            y: cy + offset,
            width: rowSize,
            height: itemSize
          });
        } else {
          results.push({
            ...item,
            x: cx + offset,
            y: cy,
            width: itemSize,
            height: rowSize
          });
        }
        offset += itemSize;
      });

      // Update remaining area
      if (isWide) {
        cx += rowSize;
        cw -= rowSize;
      } else {
        cy += rowSize;
        ch -= rowSize;
      }

      remaining = remaining.slice(row.length);
    }

    return results;
  }

  /**
   * Calculate worst aspect ratio in a row
   */
  _worstRatio(row, rowTotal, side, areaTotal, totalArea) {
    const rowArea = (rowTotal / areaTotal) * totalArea;
    const rowSide = rowArea / side;

    let worst = 0;
    row.forEach(item => {
      const itemSide = (item.value / rowTotal) * side;
      const ratio = Math.max(rowSide / itemSide, itemSide / rowSide);
      if (ratio > worst) worst = ratio;
    });
    return worst;
  }

  /**
   * Render treemap chart
   */
  render() {
    const { data, style, options } = this.config;
    const dataset = data.datasets[0];
    if (!dataset?.values) return;

    const treemap = style.treemap || {};
    const padding = options.padding || 20;
    const topSpace = options.legend?.enabled ? 40 : 10;

    const chartX = padding;
    const chartY = topSpace + padding;
    const chartWidth = this.width - padding * 2;
    const chartHeight = this.height - chartY - padding;

    // Build items
    const items = dataset.values.map((value, i) => ({
      index: i,
      value: Math.abs(value),
      label: data.labels?.[i] || `Item ${i + 1}`,
      color: dataset.colors?.[i] || this.getPaletteColor(i),
      growth: dataset.growth?.[i] // optional growth indicator
    }));

    const gap = treemap.gap || 3;
    const borderRadius = treemap.borderRadius || 4;

    // Layout
    const laid = this.squarify(items, chartX, chartY, chartWidth, chartHeight);

    this._tileElements = [];

    laid.forEach((tile) => {
      const tx = tile.x + gap / 2;
      const ty = tile.y + gap / 2;
      const tw = tile.width - gap;
      const th = tile.height - gap;

      if (tw < 2 || th < 2) return;

      const el = this.renderer.rect(tx, ty, tw, th, {
        fill: tile.color,
        borderRadius
      });

      this._tileElements.push({ element: el, tile });

      // Labels inside tile
      if (tw > 40 && th > 24) {
        // Label
        this.renderer.text(tile.label, tx + 6, ty + 6, {
          fill: '#ffffff',
          fontSize: Math.min(12, tw / 8),
          fontFamily: style.fontFamily,
          textAnchor: 'start',
          dominantBaseline: 'hanging',
          fontWeight: 600
        });

        // Value
        if (th > 40) {
          this.renderer.text(this.formatValue(tile.value, null, 'label'), tx + 6, ty + 22, {
            fill: 'rgba(255,255,255,0.8)',
            fontSize: Math.min(11, tw / 9),
            fontFamily: style.monoFamily || style.fontFamily,
            textAnchor: 'start',
            dominantBaseline: 'hanging'
          });
        }

        // Growth indicator
        if (tile.growth !== undefined && th > 54) {
          const growthText = (tile.growth >= 0 ? '+' : '') + this.formatValue(tile.growth, 1, 'label') + '%';
          const growthColor = tile.growth >= 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,200,200,0.9)';

          this.renderer.text(growthText, tx + 6, ty + 36, {
            fill: growthColor,
            fontSize: 10,
            fontFamily: style.monoFamily || style.fontFamily,
            textAnchor: 'start',
            dominantBaseline: 'hanging'
          });
        }
      }

      // Hover
      if (el) {
        el.style.cursor = 'pointer';
        el.style.transition = 'filter 0.15s ease-out, opacity 0.15s ease-out';

        this.addElementListener(el, 'mouseenter', (e) => {
          el.style.filter = 'brightness(1.15)';
          this._tileElements.forEach(({ element: other }) => {
            if (other !== el) other.setAttribute('opacity', '0.5');
          });

          const tooltipData = {
            [tile.label]: this.formatValue(tile.value, null, 'tooltip')
          };
          if (tile.growth !== undefined) {
            tooltipData['Growth'] = (tile.growth >= 0 ? '+' : '') + this.formatValue(tile.growth, 1, 'tooltip') + '%';
          }
          this.showTooltip(e, tooltipData);
        });

        this.addElementListener(el, 'mouseleave', () => {
          el.style.filter = '';
          this._tileElements.forEach(({ element: other }) => {
            other.setAttribute('opacity', '1');
          });
        });

        this.addElementListener(el, 'click', (e) => {
          if (typeof options.onClick === 'function') {
            options.onClick({
              index: tile.index,
              label: tile.label,
              value: tile.value,
              growth: tile.growth,
              event: e
            });
          }
        });
      }
    });
  }

  /**
   * Animate tiles scaling in
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;
    if (!this._tileElements?.length) return;

    this._tileElements.forEach(({ element }, i) => {
      if (!element) return;
      element.style.opacity = '0';
      element.style.transform = 'scale(0.8)';
      element.style.transition = `opacity ${duration * 0.4}ms ease-out, transform ${duration * 0.6}ms cubic-bezier(0.34, 1.2, 0.64, 1)`;

      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
      }, i * 30);
    });

    const totalTime = duration + this._tileElements.length * 30;
    setTimeout(() => {
      this._tileElements.forEach(({ element }) => {
        if (!element) return;
        element.style.transition = 'filter 0.15s ease-out, opacity 0.15s ease-out';
      });
    }, totalTime);
  }
}

export default TreemapChart;
