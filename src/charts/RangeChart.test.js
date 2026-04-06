import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RangeChart } from './RangeChart.js';

describe('RangeChart', () => {
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
    return new RangeChart(container, {
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          { label: 'Revenue', values: [100, 120, 110, 140, 130, 150], fill: true }
        ],
        zones: [
          { from: 0, to: 1, label: 'Winter Sale', color: '#4c6ef5', opacity: 0.1 }
        ],
        annotations: [
          { index: 3, label: 'Launch', color: '#e03131' }
        ]
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

  it('renders polyline for data series', () => {
    const chart = createChart();
    const polylines = container.querySelectorAll('polyline');
    expect(polylines.length).toBeGreaterThanOrEqual(1);
    chart.destroy();
  });

  it('renders zone rectangles', () => {
    const chart = createChart();
    const rects = container.querySelectorAll('rect');
    // background + zone rect
    expect(rects.length).toBeGreaterThanOrEqual(2);
    chart.destroy();
  });

  it('renders zone labels', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Winter Sale');
    chart.destroy();
  });

  it('renders annotation markers', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Launch');
    chart.destroy();
  });

  it('renders annotation as dashed line', () => {
    const chart = createChart();
    const lines = container.querySelectorAll('line');
    const dashed = Array.from(lines).filter(l => l.getAttribute('stroke-dasharray'));
    expect(dashed.length).toBeGreaterThanOrEqual(1);
    chart.destroy();
  });

  it('renders data points as circles', () => {
    const chart = createChart();
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(6); // 6 data points
    chart.destroy();
  });

  it('renders axis labels', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Jan');
    chart.destroy();
  });

  it('handles empty datasets', () => {
    const chart = createChart({
      data: { labels: [], datasets: [], zones: [], annotations: [] }
    });
    chart.destroy();
  });

  it('handles multiple datasets', () => {
    const chart = createChart({
      data: {
        labels: ['A', 'B', 'C'],
        datasets: [
          { label: 'Series 1', values: [10, 20, 15] },
          { label: 'Series 2', values: [8, 18, 12], dash: true }
        ],
        zones: [],
        annotations: []
      }
    });
    const polylines = container.querySelectorAll('polyline');
    expect(polylines.length).toBeGreaterThanOrEqual(2);
    chart.destroy();
  });

  it('supports fill option for area under line', () => {
    const chart = createChart();
    const polylines = container.querySelectorAll('polyline');
    // Should have at least 2 polylines: area fill + line
    expect(polylines.length).toBeGreaterThanOrEqual(2);
    chart.destroy();
  });
});
