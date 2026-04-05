import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PieChart } from './PieChart.js';

describe('PieChart', () => {
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
    return new PieChart(container, {
      data: {
        labels: ['Red', 'Blue', 'Green'],
        datasets: [{ values: [40, 35, 25], colors: ['#f00', '#00f', '#0f0'] }]
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

  it('renders path elements for slices', () => {
    const chart = createChart();
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(3);
    chart.destroy();
  });

  it('renders labels', () => {
    const chart = createChart();
    const texts = container.querySelectorAll('text');
    // Should have percentage labels
    expect(texts.length).toBe(3);
    chart.destroy();
  });

  it('handles empty dataset', () => {
    const chart = createChart({
      data: { labels: [], datasets: [{ values: [] }] }
    });
    chart.destroy();
  });

  it('handles all-zero values', () => {
    const chart = createChart({
      data: { labels: ['A', 'B'], datasets: [{ values: [0, 0] }] }
    });
    chart.destroy();
  });

  it('calculateSlices returns correct slice count', () => {
    const chart = createChart();
    const slices = chart.calculateSlices();
    expect(slices).toHaveLength(3);
    chart.destroy();
  });

  it('calculateSlices computes correct percentages', () => {
    const chart = createChart();
    const slices = chart.calculateSlices();
    expect(slices[0].percent).toBe(40);
    expect(slices[1].percent).toBe(35);
    expect(slices[2].percent).toBe(25);
    chart.destroy();
  });

  it('slices cover full circle', () => {
    const chart = createChart();
    const slices = chart.calculateSlices();
    const totalAngle = slices.reduce(
      (sum, s) => sum + (s.endAngle - s.startAngle),
      0
    );
    expect(totalAngle).toBeCloseTo(Math.PI * 2, 5);
    chart.destroy();
  });

  it('supports donut mode with innerRadius', () => {
    const chart = createChart({
      style: { pie: { innerRadius: 50 } }
    });
    const slices = chart.calculateSlices();
    slices.forEach(s => {
      expect(s.innerRadius).toBe(50);
    });
    chart.destroy();
  });

  it('hides labels when position is none', () => {
    const chart = createChart({
      options: { labels: { position: 'none' } }
    });
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(0);
    chart.destroy();
  });
});
