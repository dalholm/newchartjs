import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HeatmapChart } from './HeatmapChart.js';

describe('HeatmapChart', () => {
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
    return new HeatmapChart(container, {
      data: {
        labels: ['Mon', 'Tue', 'Wed'],
        yLabels: ['9AM', '10AM', '11AM'],
        datasets: [{
          values: [
            [10, 20, 30],
            [40, 50, 60],
            [70, 80, 90]
          ]
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

  it('renders rect elements for cells', () => {
    const chart = createChart();
    const rects = container.querySelectorAll('rect');
    // background + 9 cells + color scale rects
    expect(rects.length).toBeGreaterThanOrEqual(10);
    chart.destroy();
  });

  it('renders axis labels', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Mon');
    expect(texts).toContain('9AM');
    chart.destroy();
  });

  it('handles empty dataset', () => {
    const chart = createChart({
      data: { labels: [], yLabels: [], datasets: [{ values: [] }] }
    });
    chart.destroy();
  });

  it('stores _cellElements for interaction', () => {
    const chart = createChart();
    expect(chart._cellElements).toBeDefined();
    expect(chart._cellElements.length).toBe(9);
    chart.destroy();
  });

  it('interpolateColor returns valid rgb string', () => {
    const chart = createChart();
    const color = chart.interpolateColor('#000000', '#ffffff', 0.5);
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    chart.destroy();
  });

  it('interpolateColor at 0 returns low color', () => {
    const chart = createChart();
    const color = chart.interpolateColor('#ff0000', '#0000ff', 0);
    expect(color).toBe('rgb(255, 0, 0)');
    chart.destroy();
  });

  it('interpolateColor at 1 returns high color', () => {
    const chart = createChart();
    const color = chart.interpolateColor('#ff0000', '#0000ff', 1);
    expect(color).toBe('rgb(0, 0, 255)');
    chart.destroy();
  });

  it('supports custom color scale', () => {
    const chart = createChart({
      style: {
        heatmap: {
          colorLow: '#ff0000',
          colorMid: '#ffff00',
          colorHigh: '#00ff00'
        }
      }
    });
    expect(container.querySelector('svg')).not.toBeNull();
    chart.destroy();
  });

  it('handles null values in matrix', () => {
    const chart = createChart({
      data: {
        labels: ['A', 'B'],
        yLabels: ['X'],
        datasets: [{ values: [[10, null]] }]
      }
    });
    expect(chart._cellElements.length).toBe(1);
    chart.destroy();
  });
});
