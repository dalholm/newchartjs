import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SparklineChart } from './SparklineChart.js';

describe('SparklineChart', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '120px';
    container.style.height = '32px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function createChart(config = {}) {
    return new SparklineChart(container, {
      data: {
        datasets: [{ values: [10, 20, 15, 30, 25, 35], color: '#4c6ef5' }]
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

  it('allows smaller dimensions than standard charts', () => {
    const chart = createChart();
    // SparklineChart overrides updateDimensions to allow small sizes
    expect(chart.width).toBeLessThanOrEqual(300);
    chart.destroy();
  });

  it('renders a line path by default', () => {
    const chart = createChart();
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
    chart.destroy();
  });

  it('highlights the last point by default', () => {
    const chart = createChart();
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(1);
    chart.destroy();
  });

  it('does not highlight last point when highlightLast is false', () => {
    const chart = createChart({
      options: { highlightLast: false }
    });
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(0);
    chart.destroy();
  });

  it('has no legend', () => {
    const chart = createChart();
    expect(chart.legend).toBeNull();
    chart.destroy();
  });

  describe('variant: area', () => {
    it('renders area fill with gradient', () => {
      const chart = createChart({
        options: { variant: 'area' }
      });
      const defs = container.querySelector('defs');
      expect(defs).not.toBeNull();
      const gradients = defs.querySelectorAll('linearGradient');
      expect(gradients.length).toBeGreaterThanOrEqual(1);
      chart.destroy();
    });

    it('renders both fill path and line path', () => {
      const chart = createChart({
        options: { variant: 'area' }
      });
      const paths = container.querySelectorAll('path');
      // Area fill + line stroke
      expect(paths.length).toBeGreaterThanOrEqual(2);
      chart.destroy();
    });
  });

  describe('variant: bar', () => {
    it('renders rect elements for bars', () => {
      const chart = createChart({
        options: { variant: 'bar' }
      });
      const rects = container.querySelectorAll('rect');
      // 6 data bars + 1 background rect (transparent, from base Chart)
      expect(rects.length).toBeGreaterThanOrEqual(6);
      chart.destroy();
    });

    it('does not highlight last point for bar variant', () => {
      const chart = createChart({
        options: { variant: 'bar' }
      });
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(0);
      chart.destroy();
    });
  });

  describe('reference line', () => {
    it('renders a dashed reference line when referenceLine is set', () => {
      const chart = createChart({
        options: { referenceLine: 20 }
      });
      const lines = container.querySelectorAll('line');
      const dashed = Array.from(lines).filter(l => l.getAttribute('stroke-dasharray'));
      expect(dashed.length).toBeGreaterThanOrEqual(1);
      chart.destroy();
    });

    it('does not render reference line when not set', () => {
      const chart = createChart();
      const lines = container.querySelectorAll('line');
      const dashed = Array.from(lines).filter(l => l.getAttribute('stroke-dasharray'));
      expect(dashed.length).toBe(0);
      chart.destroy();
    });
  });

  it('handles empty dataset gracefully', () => {
    const chart = createChart({
      data: { datasets: [{ values: [] }] }
    });
    chart.destroy();
  });

  it('handles single data point', () => {
    const chart = createChart({
      data: { datasets: [{ values: [42], color: '#4c6ef5' }] }
    });
    chart.destroy();
  });

  describe('resize stability', () => {
    it('dimensions stay stable after multiple draw cycles', () => {
      const chart = createChart();
      const initialWidth = chart.width;
      const initialHeight = chart.height;

      for (let i = 0; i < 5; i++) {
        chart.updateDimensions();
        chart.draw();
      }

      expect(chart.width).toBe(initialWidth);
      expect(chart.height).toBe(initialHeight);
      chart.destroy();
    });
  });
});
