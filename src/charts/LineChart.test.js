import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LineChart } from './LineChart.js';
import { getBezierPath } from '../core/utils.js';

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
    // No circles when showPoints is false
    expect(circles.length).toBe(0);
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
    const points = [[0, 0], [50, 50], [100, 25]];
    const path = getBezierPath(points, 0.4);
    expect(path).toMatch(/^M /);
    expect(path).toContain('C ');
  });

  it('getBezierPath returns empty string for < 2 points', () => {
    expect(getBezierPath([[0, 0]])).toBe('');
    expect(getBezierPath([])).toBe('');
  });

  // ═══ NEW FEATURE TESTS ═══

  describe('gradient area fill', () => {
    it('creates a linearGradient defs element when fill is enabled', () => {
      const chart = createChart({
        options: { fill: true, smooth: true }
      });
      const defs = container.querySelector('defs');
      expect(defs).not.toBeNull();
      const gradients = defs.querySelectorAll('linearGradient');
      expect(gradients.length).toBeGreaterThanOrEqual(1);
      chart.destroy();
    });

    it('gradient has two stop elements with correct opacities', () => {
      const chart = createChart({
        options: { fill: true }
      });
      const gradient = container.querySelector('linearGradient');
      expect(gradient).not.toBeNull();
      const stops = gradient.querySelectorAll('stop');
      expect(stops.length).toBe(2);
      expect(stops[0].getAttribute('stop-opacity')).toBe('0.12');
      expect(stops[1].getAttribute('stop-opacity')).toBe('0.01');
      chart.destroy();
    });

    it('renders area fill path that closes to baseline', () => {
      const chart = createChart({
        options: { fill: true }
      });
      const paths = container.querySelectorAll('path');
      // At least one path should have a fill (the area) and one for the line
      const filledPaths = Array.from(paths).filter(p =>
        p.getAttribute('fill') && p.getAttribute('fill') !== 'none'
      );
      expect(filledPaths.length).toBeGreaterThanOrEqual(1);
      chart.destroy();
    });

    it('does not create gradient when fill is false', () => {
      const chart = createChart({
        options: { fill: false }
      });
      const defs = container.querySelector('defs');
      expect(defs).toBeNull();
      chart.destroy();
    });

    it('skips gradient fill for dashed datasets', () => {
      const chart = createChart({
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [
            { label: 'Current', values: [10, 20, 30], color: '#4c6ef5' },
            { label: 'Previous', values: [8, 15, 25], color: '#b3bac5', dash: true }
          ]
        },
        options: { fill: true }
      });
      const gradients = container.querySelectorAll('linearGradient');
      // Only one gradient for the non-dashed dataset
      expect(gradients.length).toBe(1);
      chart.destroy();
    });
  });

  describe('per-dataset dash style', () => {
    it('renders dashed line when dataset has dash: true', () => {
      const chart = createChart({
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [
            { label: 'Current', values: [10, 20, 30], color: '#4c6ef5' },
            { label: 'Previous', values: [8, 15, 25], color: '#b3bac5', dash: true, dashPattern: '5 3' }
          ]
        }
      });
      const paths = container.querySelectorAll('path');
      const dashedPaths = Array.from(paths).filter(p =>
        p.getAttribute('stroke-dasharray') === '5 3'
      );
      expect(dashedPaths.length).toBe(1);
      chart.destroy();
    });

    it('non-dashed datasets have no stroke-dasharray', () => {
      const chart = createChart();
      const paths = container.querySelectorAll('path');
      const linePaths = Array.from(paths).filter(p =>
        p.getAttribute('stroke') === '#4c6ef5'
      );
      linePaths.forEach(p => {
        expect(p.hasAttribute('stroke-dasharray')).toBe(false);
      });
      chart.destroy();
    });
  });

  describe('crosshair', () => {
    it('creates a crosshair line element', () => {
      const chart = createChart();
      expect(chart._crosshairLine).not.toBeNull();
      chart.destroy();
    });

    it('crosshair starts hidden (opacity 0)', () => {
      const chart = createChart();
      expect(chart._crosshairLine.getAttribute('opacity')).toBe('0');
      chart.destroy();
    });

    it('crosshair is a dashed vertical line', () => {
      const chart = createChart();
      const cl = chart._crosshairLine;
      expect(cl.getAttribute('stroke-dasharray')).toBe('3 3');
      chart.destroy();
    });

    it('creates hitbox rects for each data point column', () => {
      const chart = createChart();
      const rects = Array.from(container.querySelectorAll('rect'));
      const transparent = rects.filter(r => r.getAttribute('fill') === 'transparent');
      // One hitbox per data point
      expect(transparent.length).toBe(4);
      chart.destroy();
    });

    it('points start hidden (opacity 0) for crosshair reveal', () => {
      const chart = createChart();
      const circles = container.querySelectorAll('circle');
      circles.forEach(c => {
        expect(c.getAttribute('opacity')).toBe('0');
      });
      chart.destroy();
    });
  });

  describe('legend visibility filtering', () => {
    it('calculateScales filters datasets by legend visibility', () => {
      const chart = createChart({
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [
            { label: 'Line 1', values: [10, 20, 30], color: '#f00' },
            { label: 'Line 2', values: [100, 200, 300], color: '#0f0' }
          ]
        }
      });

      chart._legendVisibility = { 'Line 1': true, 'Line 2': false };
      const scales = chart.calculateScales();
      expect(scales.visibleDatasets.length).toBe(1);
      expect(scales.maxValue).toBe(30); // only Line 1 data
      chart.destroy();
    });
  });
});
