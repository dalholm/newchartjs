import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Chart } from './Chart.js';
import { BarChart } from '../charts/BarChart.js';

describe('Chart base class', () => {
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

  it('throws when element not found', () => {
    expect(() => new Chart('#nonexistent')).toThrow('Chart element not found');
  });

  it('creates container div inside element', () => {
    const chart = new BarChart(container, {
      data: { labels: ['A'], datasets: [{ values: [10] }] }
    });
    const inner = container.querySelector('div');
    expect(inner).not.toBeNull();
    chart.destroy();
  });

  it('merges config with defaults', () => {
    const chart = new BarChart(container, {
      data: { labels: ['A'], datasets: [{ values: [10] }] },
      style: { background: '#f0f0f0' }
    });
    expect(chart.config.style.background).toBe('#f0f0f0');
    expect(chart.config.options.responsive).toBe(true);
    chart.destroy();
  });

  it('update merges new config', () => {
    const chart = new BarChart(container, {
      data: { labels: ['A'], datasets: [{ values: [10] }] }
    });
    chart.update({ style: { background: '#000' } });
    expect(chart.config.style.background).toBe('#000');
    chart.destroy();
  });

  it('destroy cleans up DOM', () => {
    const chart = new BarChart(container, {
      data: { labels: ['A'], datasets: [{ values: [10] }] }
    });
    chart.destroy();
    expect(container.querySelector('div[style*="relative"]')).toBeNull();
  });

  it('getPaletteColor wraps around', () => {
    const chart = new BarChart(container, {
      data: { labels: ['A'], datasets: [{ values: [10] }] }
    });
    const color0 = chart.getPaletteColor(0);
    const color10 = chart.getPaletteColor(10);
    expect(color0).toBe(color10);
    chart.destroy();
  });

  it('shouldUseCanvas returns false for small datasets', () => {
    const chart = new BarChart(container, {
      data: { labels: ['A', 'B'], datasets: [{ values: [10, 20] }] }
    });
    expect(chart.shouldUseCanvas()).toBe(false);
    chart.destroy();
  });

  describe('dynamic Y-axis width', () => {
    it('allocates more leftSpace for large values (millions)', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A', 'B'], datasets: [{ values: [1500000, 2000000] }] },
        style: { animation: { duration: 0 } }
      });
      const layout = chart.calculateLayout();
      // For million-scale values like "2,000,000", leftSpace should be > 60px
      expect(layout.leftSpace).toBeGreaterThan(60);
      chart.destroy();
    });

    it('keeps minimum 60px leftSpace for small values', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A', 'B'], datasets: [{ values: [10, 20] }] },
        style: { animation: { duration: 0 } }
      });
      const layout = chart.calculateLayout();
      expect(layout.leftSpace).toBeGreaterThanOrEqual(60);
      chart.destroy();
    });

    it('Y-axis labels are not clipped for 7-digit numbers', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A', 'B', 'C'], datasets: [{ values: [1000000, 2500000, 3000000] }] },
        style: { animation: { duration: 0 } }
      });
      const layout = chart.calculateLayout();
      // chartX must be large enough that text ending at chartX-10 doesn't go past x=0
      // For "3,000,000" at 12px font, ~65px wide, so chartX should be >= 75
      expect(layout.chartX).toBeGreaterThanOrEqual(70);
      chart.destroy();
    });
  });

  describe('tooltip positioning', () => {
    it('tooltip element is inside the positioned container, not the outer element', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A'], datasets: [{ values: [10] }] },
        style: { animation: { duration: 0 } }
      });

      // The tooltip's parent container must have position:relative
      // so that position:absolute on the tooltip works correctly
      expect(chart.tooltip.container).toBe(chart.container);
      expect(chart.tooltip.container.style.position).toBe('relative');
      chart.destroy();
    });

    it('showTooltip positions tooltip relative to its container', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A'], datasets: [{ values: [10] }] },
        style: { animation: { duration: 0 } }
      });

      // Simulate a mouse event
      const fakeEvent = {
        clientX: 200,
        clientY: 150
      };
      chart.showTooltip(fakeEvent, { Test: '123' });

      // Tooltip should be visible and positioned
      expect(chart.tooltip.visible).toBe(true);

      // The tooltip element should be a child of chart.container
      expect(chart.tooltip.element.parentNode).toBe(chart.container);
      chart.destroy();
    });

    it('tooltip follow uses same coordinate space as showTooltip', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A'], datasets: [{ values: [10] }] },
        style: { animation: { duration: 0 } }
      });

      const fakeEvent = { clientX: 300, clientY: 200 };
      chart.showTooltip(fakeEvent, { Test: '456' });

      // follow() should compute coordinates relative to the same container
      // that the tooltip is mounted in (chart.container)
      chart.tooltip.follow(fakeEvent);

      // Both showTooltip and follow should use the same container for coordinates
      // If they don't, the tooltip jumps when the mouse moves
      expect(chart.tooltip.container).toBe(chart.container);
      chart.destroy();
    });
  });

  describe('resize stability (no infinite growth)', () => {
    it('updateDimensions hides children before measuring to avoid content-driven inflation', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A'], datasets: [{ values: [10] }] },
        style: { animation: { duration: 0 } }
      });

      // Spy: when measuring, children should be hidden
      const origGetBCR = container.getBoundingClientRect.bind(container);
      let childrenHiddenDuringMeasure = false;
      container.getBoundingClientRect = function () {
        const children = Array.from(container.children);
        childrenHiddenDuringMeasure = children.every(c => c.style.display === 'none');
        return origGetBCR();
      };

      chart.updateDimensions();
      expect(childrenHiddenDuringMeasure).toBe(true);

      // Children should be restored after measurement
      const children = Array.from(container.children);
      const allVisible = children.every(c => c.style.display !== 'none');
      expect(allVisible).toBe(true);

      container.getBoundingClientRect = origGetBCR;
      chart.destroy();
    });

    it('dimensions stay stable after multiple updateDimensions calls', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A', 'B', 'C'], datasets: [{ values: [10, 20, 30] }] },
        style: { animation: { duration: 0 } }
      });

      const initialWidth = chart.width;
      const initialHeight = chart.height;

      for (let i = 0; i < 10; i++) {
        chart.updateDimensions();
      }

      expect(chart.width).toBe(initialWidth);
      expect(chart.height).toBe(initialHeight);
      chart.destroy();
    });

    it('dimensions stay stable after multiple draw cycles', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A', 'B', 'C'], datasets: [{ values: [10, 20, 30] }] },
        style: { animation: { duration: 0 } }
      });

      const initialWidth = chart.width;
      const initialHeight = chart.height;

      // Simulate what ResizeObserver would trigger repeatedly
      for (let i = 0; i < 5; i++) {
        chart.updateDimensions();
        chart.draw();
      }

      expect(chart.width).toBe(initialWidth);
      expect(chart.height).toBe(initialHeight);
      chart.destroy();
    });

    it('element bounding rect does not grow after multiple re-renders', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A', 'B'], datasets: [{ values: [10, 20] }] },
        style: { animation: { duration: 0 } }
      });

      const rectBefore = container.getBoundingClientRect();

      chart.draw();
      chart.draw();
      chart.draw();

      const rectAfter = container.getBoundingClientRect();
      expect(rectAfter.height).toBe(rectBefore.height);
      expect(rectAfter.width).toBe(rectBefore.width);
      chart.destroy();
    });

    it('chart with legend does not grow on repeated resize + draw cycles', () => {
      const chart = new BarChart(container, {
        data: {
          labels: ['A', 'B'],
          datasets: [
            { label: 'Series 1', values: [10, 20], color: '#f00' },
            { label: 'Series 2', values: [15, 25], color: '#0f0' }
          ]
        },
        options: { legend: { enabled: true } },
        style: { animation: { duration: 0 } }
      });

      const heightAfterInit = chart.height;

      for (let i = 0; i < 5; i++) {
        chart.updateDimensions();
        chart.draw();
      }

      expect(chart.height).toBe(heightAfterInit);
      chart.destroy();
    });

    it('children display styles are restored after updateDimensions', () => {
      const chart = new BarChart(container, {
        data: {
          labels: ['A', 'B'],
          datasets: [{ label: 'Test', values: [10, 20], color: '#f00' }]
        },
        options: { legend: { enabled: true } },
        style: { animation: { duration: 0 } }
      });

      // Record display before
      const children = Array.from(container.children);
      const displayBefore = children.map(c => c.style.display);

      chart.updateDimensions();

      // Display should be identical after measurement
      children.forEach((c, i) => {
        expect(c.style.display).toBe(displayBefore[i]);
      });

      chart.destroy();
    });
  });
});
