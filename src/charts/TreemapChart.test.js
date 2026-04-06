import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TreemapChart } from './TreemapChart.js';

describe('TreemapChart', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '600px';
    container.style.height = '400px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function createChart(config = {}) {
    return new TreemapChart(container, {
      data: {
        labels: ['Mattresses', 'Pillows', 'Frames', 'Bath', 'Other'],
        datasets: [{
          values: [14000, 9000, 6000, 5000, 2000],
          growth: [15, 10, -2, 22, 6]
        }]
      },
      style: { animation: { duration: 0 } },
      ...config
    });
  }

  it('creates an SVG element', () => {
    const chart = createChart();
    expect(container.querySelector('svg')).not.toBeNull();
    chart.destroy();
  });

  it('renders rect elements for tiles', () => {
    const chart = createChart();
    const rects = container.querySelectorAll('rect');
    // background + 5 tiles
    expect(rects.length).toBeGreaterThanOrEqual(6);
    chart.destroy();
  });

  it('renders tile labels', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Mattresses');
    chart.destroy();
  });

  it('squarify returns items with positions', () => {
    const chart = createChart();
    const items = [
      { value: 6, label: 'A' },
      { value: 4, label: 'B' },
      { value: 3, label: 'C' },
      { value: 2, label: 'D' }
    ];
    const result = chart.squarify(items, 0, 0, 100, 100);
    expect(result.length).toBe(4);
    result.forEach(r => {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.width).toBeGreaterThan(0);
      expect(r.height).toBeGreaterThan(0);
    });
    chart.destroy();
  });

  it('squarify tiles do not overlap', () => {
    const chart = createChart();
    const items = [
      { value: 50, label: 'A' },
      { value: 30, label: 'B' },
      { value: 20, label: 'C' }
    ];
    const result = chart.squarify(items, 0, 0, 200, 100);
    // Simple non-overlap check: no two tiles share same center
    const centers = result.map(r => `${Math.round(r.x + r.width/2)},${Math.round(r.y + r.height/2)}`);
    const unique = new Set(centers);
    expect(unique.size).toBe(centers.length);
    chart.destroy();
  });

  it('handles empty dataset', () => {
    const chart = createChart({
      data: { labels: [], datasets: [{ values: [] }] }
    });
    chart.destroy();
  });

  it('handles single item', () => {
    const chart = createChart({
      data: { labels: ['Only'], datasets: [{ values: [100] }] }
    });
    expect(chart._tileElements.length).toBe(1);
    chart.destroy();
  });

  it('stores _tileElements for interaction', () => {
    const chart = createChart();
    expect(chart._tileElements).toBeDefined();
    expect(chart._tileElements.length).toBe(5);
    chart.destroy();
  });

  it('calls onClick when a tile is clicked', () => {
    const onClick = vi.fn();
    const chart = createChart({ options: { onClick } });
    const rects = container.querySelectorAll('rect');
    // Find a tile rect (skip background)
    rects[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalled();
    chart.destroy();
  });

  it('renders growth indicators', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts.some(t => t.includes('+15'))).toBe(true);
    chart.destroy();
  });
});
