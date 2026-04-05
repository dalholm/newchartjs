import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
    // Only center text should be absent (no labels, no donut center text)
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(0);
    chart.destroy();
  });

  // ═══ NEW FEATURE TESTS ═══

  describe('hover explode', () => {
    it('slice elements have CSS transition for transform', () => {
      const chart = createChart();
      const paths = container.querySelectorAll('path');
      paths.forEach(p => {
        expect(p.style.transition).toContain('transform');
      });
      chart.destroy();
    });

    it('slice elements have transformOrigin set to center', () => {
      const chart = createChart();
      const slices = chart.calculateSlices();
      const paths = container.querySelectorAll('path');
      paths.forEach(p => {
        expect(p.style.transformOrigin).not.toBe('');
      });
      chart.destroy();
    });

    it('stores _sliceElements for hover interaction', () => {
      const chart = createChart();
      expect(chart._sliceElements).toBeDefined();
      expect(chart._sliceElements.length).toBe(3);
      chart.destroy();
    });
  });

  describe('donut center text', () => {
    it('renders center text for donut charts', () => {
      const chart = createChart({
        style: { pie: { innerRadius: 50 } },
        options: { labels: { position: 'none' } }
      });
      const texts = container.querySelectorAll('text');
      const textContents = Array.from(texts).map(t => t.textContent);
      // Should have total value and "total" label
      expect(textContents).toContain('total');
      chart.destroy();
    });

    it('does not render center text for regular pie', () => {
      const chart = createChart({
        style: { pie: { innerRadius: 0 } },
        options: { labels: { position: 'none' } }
      });
      const texts = container.querySelectorAll('text');
      const textContents = Array.from(texts).map(t => t.textContent);
      expect(textContents).not.toContain('total');
      chart.destroy();
    });

    it('stores _centerTextValue and _centerTextLabel refs for donut', () => {
      const chart = createChart({
        style: { pie: { innerRadius: 50 } }
      });
      expect(chart._centerTextValue).toBeDefined();
      expect(chart._centerTextLabel).toBeDefined();
      chart.destroy();
    });
  });

  describe('onClick callback', () => {
    it('calls onClick when a slice is clicked', () => {
      const onClick = vi.fn();
      const chart = createChart({
        options: { onClick }
      });

      const paths = container.querySelectorAll('path');
      paths[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({
        index: 0,
        label: 'Red',
        value: 40,
        percent: 40
      }));
      chart.destroy();
    });

    it('does not throw when no onClick is provided', () => {
      const chart = createChart();
      const paths = container.querySelectorAll('path');
      expect(() => {
        paths[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }).not.toThrow();
      chart.destroy();
    });
  });

  describe('opacity dimming', () => {
    it('slices start with opacity 1', () => {
      const chart = createChart();
      const paths = container.querySelectorAll('path');
      paths.forEach(p => {
        expect(p.getAttribute('opacity')).toBe('1');
      });
      chart.destroy();
    });
  });
});
