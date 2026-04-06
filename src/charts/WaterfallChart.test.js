import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WaterfallChart } from './WaterfallChart.js';

describe('WaterfallChart', () => {
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
    return new WaterfallChart(container, {
      data: {
        labels: ['Revenue', 'Discounts', 'Returns', 'Net'],
        datasets: [{
          values: [5000, -800, -400, 0],
          types: ['increase', 'decrease', 'decrease', 'total']
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

  it('renders rect or path elements for bars', () => {
    const chart = createChart();
    const rects = container.querySelectorAll('rect');
    const paths = container.querySelectorAll('path');
    // Bars may render as path (top-only border radius) or rect
    // background rect + bar elements (rect or path)
    expect(rects.length + paths.length).toBeGreaterThanOrEqual(5);
    chart.destroy();
  });

  it('renders axis labels', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Revenue');
    expect(texts).toContain('Net');
    chart.destroy();
  });

  it('renders value labels on bars', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    // Should contain formatted values
    expect(texts.some(t => t.includes('5,000') || t.includes('5000'))).toBe(true);
    chart.destroy();
  });

  it('handles empty datasets', () => {
    const chart = createChart({
      data: { labels: [], datasets: [{ values: [], types: [] }] }
    });
    chart.destroy();
  });

  it('correctly classifies positive as increase', () => {
    const chart = createChart({
      data: {
        labels: ['A', 'B'],
        datasets: [{ values: [100, 50] }] // no types - auto-detect
      }
    });
    expect(chart.bars[0].type).toBe('increase');
    expect(chart.bars[1].type).toBe('increase');
    chart.destroy();
  });

  it('correctly classifies negative as decrease', () => {
    const chart = createChart({
      data: {
        labels: ['Start', 'Loss'],
        datasets: [{ values: [100, -30] }]
      }
    });
    expect(chart.bars[1].type).toBe('decrease');
    chart.destroy();
  });

  it('total bar shows running total from 0', () => {
    const chart = createChart();
    const totalBar = chart.bars.find(b => b.type === 'total');
    expect(totalBar).toBeDefined();
    expect(totalBar.start).toBe(0);
    // Running total: 5000 - 800 - 400 = 3800
    expect(totalBar.end).toBe(3800);
    chart.destroy();
  });

  it('renders connector lines between bars', () => {
    const chart = createChart();
    const lines = container.querySelectorAll('line');
    const dashed = Array.from(lines).filter(l => l.getAttribute('stroke-dasharray'));
    expect(dashed.length).toBeGreaterThanOrEqual(1);
    chart.destroy();
  });

  it('stores _barElements for interaction', () => {
    const chart = createChart();
    expect(chart._barElements).toBeDefined();
    expect(chart._barElements.length).toBe(4);
    chart.destroy();
  });
});
