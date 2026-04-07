import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CohortChart } from './CohortChart.js';

describe('CohortChart', () => {
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
    return new CohortChart(container, {
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        periodLabels: ['Users', 'M1', 'M2', 'M3'],
        datasets: [{
          values: [
            [1000, 68, 52, 41],
            [1200, 72, 56],
            [900, 65]
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
    // background + 4+3+2 = 9 cells
    expect(rects.length).toBeGreaterThanOrEqual(10);
    chart.destroy();
  });

  it('renders cohort labels', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Jan');
    expect(texts).toContain('Feb');
    expect(texts).toContain('Mar');
    chart.destroy();
  });

  it('renders period header labels', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Users');
    expect(texts).toContain('M1');
    chart.destroy();
  });

  it('handles empty dataset', () => {
    const chart = createChart({
      data: { labels: [], periodLabels: [], datasets: [{ values: [] }] }
    });
    chart.destroy();
  });

  it('stores _cellElements for interaction', () => {
    const chart = createChart();
    expect(chart._cellElements).toBeDefined();
    // 4 + 3 + 2 = 9 cells
    expect(chart._cellElements.length).toBe(9);
    chart.destroy();
  });

  it('renders percentage values in cells', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    // Should contain percentage values like "68%"
    expect(texts.some(t => t.includes('68'))).toBe(true);
    chart.destroy();
  });

  it('renders absolute count for first column', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts.some(t => t.includes('1k') || t.includes('1,000') || t.includes('1000'))).toBe(true);
    chart.destroy();
  });
});
