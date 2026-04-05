import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AreaChart } from './AreaChart.js';

describe('AreaChart', () => {
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
    return new AreaChart(container, {
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr'],
        datasets: [{ label: 'Revenue', values: [100, 200, 150, 300], color: '#4c6ef5' }]
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

  it('renders gradient fill by default', () => {
    const chart = createChart();
    const defs = container.querySelector('defs');
    expect(defs).not.toBeNull();
    const gradients = defs.querySelectorAll('linearGradient');
    expect(gradients.length).toBeGreaterThanOrEqual(1);
    chart.destroy();
  });

  it('renders line path on top of area fill', () => {
    const chart = createChart();
    const paths = container.querySelectorAll('path');
    // At least 2 paths: area fill + line stroke
    expect(paths.length).toBeGreaterThanOrEqual(2);
    chart.destroy();
  });

  it('renders points (hidden by default for crosshair)', () => {
    const chart = createChart();
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(4);
    circles.forEach(c => {
      expect(c.getAttribute('opacity')).toBe('0');
    });
    chart.destroy();
  });

  it('renders x-axis labels', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Jan');
    expect(texts).toContain('Apr');
    chart.destroy();
  });

  it('handles multiple datasets', () => {
    const chart = createChart({
      data: {
        labels: ['A', 'B', 'C'],
        datasets: [
          { label: 'In', values: [100, 200, 150], color: '#0ca678' },
          { label: 'Out', values: [80, 120, 110], color: '#e03131' }
        ]
      }
    });
    const gradients = container.querySelectorAll('linearGradient');
    expect(gradients.length).toBe(2);
    chart.destroy();
  });

  it('supports stacked mode', () => {
    const chart = createChart({
      data: {
        labels: ['A', 'B'],
        datasets: [
          { label: 'X', values: [10, 20], color: '#f00' },
          { label: 'Y', values: [15, 25], color: '#0f0' }
        ]
      },
      options: { stacked: true }
    });
    expect(chart.config.options.stacked).toBe(true);
    // Should render without error
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
    chart.destroy();
  });

  it('creates crosshair line', () => {
    const chart = createChart();
    expect(chart._crosshairLine).not.toBeNull();
    expect(chart._crosshairLine.getAttribute('opacity')).toBe('0');
    chart.destroy();
  });

  it('handles empty datasets gracefully', () => {
    const chart = createChart({
      data: { labels: [], datasets: [] }
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
