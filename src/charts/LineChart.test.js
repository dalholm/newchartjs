import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LineChart } from './LineChart.js';

describe('LineChart', () => {
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
    return new LineChart(container, {
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr'],
        datasets: [{ label: 'Revenue', values: [100, 200, 150, 300], color: '#4F46E5' }]
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

  it('renders path elements for lines', () => {
    const chart = createChart();
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
    chart.destroy();
  });

  it('renders circle elements for points', () => {
    const chart = createChart();
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(4);
    chart.destroy();
  });

  it('hides points when showPoints is false', () => {
    const chart = createChart({
      options: { showPoints: false }
    });
    const circles = container.querySelectorAll('circle');
    // Points with radius 0
    circles.forEach(c => {
      expect(c.getAttribute('r')).toBe('0');
    });
    chart.destroy();
  });

  it('renders x-axis labels', () => {
    const chart = createChart();
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Jan');
    expect(textContents).toContain('Apr');
    chart.destroy();
  });

  it('handles multiple datasets', () => {
    const chart = createChart({
      data: {
        labels: ['A', 'B', 'C'],
        datasets: [
          { label: 'Line 1', values: [10, 20, 30], color: '#f00' },
          { label: 'Line 2', values: [15, 25, 35], color: '#0f0' }
        ]
      }
    });
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
    chart.destroy();
  });

  it('calculateScales returns valid metrics', () => {
    const chart = createChart();
    const scales = chart.calculateScales();
    expect(scales.minValue).toBe(100);
    expect(scales.maxValue).toBe(300);
    expect(scales.numPoints).toBe(4);
    expect(scales.pointSpacing).toBeGreaterThan(0);
    chart.destroy();
  });

  it('getBezierPath returns valid SVG path', () => {
    const chart = createChart();
    const points = [[0, 0], [50, 50], [100, 25]];
    const path = chart.getBezierPath(points, 0.4);
    expect(path).toMatch(/^M /);
    expect(path).toContain('C ');
    chart.destroy();
  });

  it('getBezierPath returns empty string for < 2 points', () => {
    const chart = createChart();
    expect(chart.getBezierPath([[0, 0]])).toBe('');
    expect(chart.getBezierPath([])).toBe('');
    chart.destroy();
  });
});
