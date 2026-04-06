import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BulletChart } from './BulletChart.js';

describe('BulletChart', () => {
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
    return new BulletChart(container, {
      data: {
        datasets: [
          { label: 'Revenue', value: 75, target: 90, min: 0, max: 100 },
          { label: 'Margin', value: 32, target: 35, min: 0, max: 50 }
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

  it('renders rect elements for ranges and bars', () => {
    const chart = createChart();
    const rects = container.querySelectorAll('rect');
    // background + 3 ranges per bullet * 2 + 2 actual bars + comparative markers
    expect(rects.length).toBeGreaterThanOrEqual(9);
    chart.destroy();
  });

  it('renders labels for each bullet', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Revenue');
    expect(texts).toContain('Margin');
    chart.destroy();
  });

  it('renders target marker lines', () => {
    const chart = createChart();
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(2);
    chart.destroy();
  });

  it('renders value text', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('75');
    expect(texts).toContain('32');
    chart.destroy();
  });

  it('handles empty datasets', () => {
    const chart = createChart({
      data: { datasets: [] }
    });
    chart.destroy();
  });

  it('handles single bullet', () => {
    const chart = createChart({
      data: {
        datasets: [{ label: 'Test', value: 50, target: 80, min: 0, max: 100 }]
      }
    });
    expect(chart._bulletElements.length).toBe(1);
    chart.destroy();
  });

  it('renders comparative marker when provided', () => {
    const chart = createChart({
      data: {
        datasets: [
          { label: 'Rev', value: 75, target: 90, comparative: 60, min: 0, max: 100 }
        ]
      }
    });
    const rects = container.querySelectorAll('rect');
    // Should have comparative marker rect
    expect(rects.length).toBeGreaterThanOrEqual(6);
    chart.destroy();
  });

  it('renders subtitle when provided', () => {
    const chart = createChart({
      data: {
        datasets: [
          { label: 'Revenue', subtitle: 'YTD (M kr)', value: 75, target: 90, min: 0, max: 100 }
        ]
      }
    });
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('YTD (M kr)');
    chart.destroy();
  });

  it('stores _bulletElements for interaction', () => {
    const chart = createChart();
    expect(chart._bulletElements).toBeDefined();
    expect(chart._bulletElements.length).toBe(2);
    chart.destroy();
  });
});
