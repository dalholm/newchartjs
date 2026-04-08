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
      // With compact format "2M" is short; leftSpace should be at minimum 60px
      expect(layout.leftSpace).toBeGreaterThanOrEqual(60);
      chart.destroy();
    });

    it('allocates wider leftSpace for large values in full numberFormat', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A', 'B'], datasets: [{ values: [1500000, 2000000] }] },
        style: { animation: { duration: 0 } },
        options: { numberFormat: 'full' }
      });
      const layout = chart.calculateLayout();
      // For full-format values like "2,000,000", leftSpace should be > 60px
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

    it('Y-axis labels are not clipped for 7-digit numbers in full format', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A', 'B', 'C'], datasets: [{ values: [1000000, 2500000, 3000000] }] },
        style: { animation: { duration: 0 } },
        options: { numberFormat: 'full' }
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

  describe('formatValue', () => {
    it('uses compact auto-decimals by default', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A'], datasets: [{ values: [2500000] }] },
        style: { animation: { duration: 0 } }
      });
      expect(chart.formatValue(2500000)).toBe('2.5M');
      expect(chart.formatValue(1900000)).toBe('1.9M');
      expect(chart.formatValue(30000000)).toBe('30M');
      chart.destroy();
    });

    it('respects explicit decimals from call site', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A'], datasets: [{ values: [10] }] },
        style: { animation: { duration: 0 } }
      });
      expect(chart.formatValue(2500000, 2)).toBe('2.5M');
      expect(chart.formatValue(1234, 2)).toBe('1.23k');
      chart.destroy();
    });

    it('uses full format when numberFormat is "full"', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A'], datasets: [{ values: [10] }] },
        style: { animation: { duration: 0 } },
        options: { numberFormat: 'full' }
      });
      const result = chart.formatValue(2500000);
      const digits = result.replace(/\D/g, '');
      expect(digits).toBe('2500000');
      chart.destroy();
    });

    it('supports numberFormat as object with style and decimals', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A'], datasets: [{ values: [10] }] },
        style: { animation: { duration: 0 } },
        options: { numberFormat: { style: 'compact', decimals: 2 } }
      });
      expect(chart.formatValue(1234567)).toBe('1.23M');
      expect(chart.formatValue(50000)).toBe('50k');
      chart.destroy();
    });

    it('supports numberFormat object with style "full" and locale', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A'], datasets: [{ values: [10] }] },
        style: { animation: { duration: 0 } },
        options: { numberFormat: { style: 'full', decimals: 2, locale: 'en-US' } }
      });
      // formatNumber uses toFixed then toLocaleString; trailing zero may be stripped
      const result = chart.formatValue(1234.5);
      expect(result).toMatch(/1[,.]?234[,.]?50?/);
      chart.destroy();
    });

    it('call-site decimals override config decimals', () => {
      const chart = new BarChart(container, {
        data: { labels: ['A'], datasets: [{ values: [10] }] },
        style: { animation: { duration: 0 } },
        options: { numberFormat: { style: 'compact', decimals: 2 } }
      });
      // Call site says 0, should override config's 2
      expect(chart.formatValue(2500000, 0)).toBe('3M');
      chart.destroy();
    });

    describe('context-specific overrides', () => {
      it('axis context uses axis.decimals', () => {
        const chart = new BarChart(container, {
          data: { labels: ['A'], datasets: [{ values: [10] }] },
          style: { animation: { duration: 0 } },
          options: { numberFormat: { style: 'compact', axis: { decimals: 0 } } }
        });
        // axis: forced 0 decimals
        expect(chart.formatValue(2500000, null, 'axis')).toBe('3M');
        // no context: auto decimals
        expect(chart.formatValue(2500000)).toBe('2.5M');
        chart.destroy();
      });

      it('tooltip context uses tooltip.decimals', () => {
        const chart = new BarChart(container, {
          data: { labels: ['A'], datasets: [{ values: [10] }] },
          style: { animation: { duration: 0 } },
          options: { numberFormat: { style: 'compact', tooltip: { decimals: 2 } } }
        });
        expect(chart.formatValue(1234567, null, 'tooltip')).toBe('1.23M');
        chart.destroy();
      });

      it('label context uses label.decimals', () => {
        const chart = new BarChart(container, {
          data: { labels: ['A'], datasets: [{ values: [10] }] },
          style: { animation: { duration: 0 } },
          options: { numberFormat: { style: 'compact', label: { decimals: 1 } } }
        });
        expect(chart.formatValue(50000, null, 'label')).toBe('50k');
        expect(chart.formatValue(2500000, null, 'label')).toBe('2.5M');
        chart.destroy();
      });

      it('context overrides fall back to global decimals', () => {
        const chart = new BarChart(container, {
          data: { labels: ['A'], datasets: [{ values: [10] }] },
          style: { animation: { duration: 0 } },
          options: { numberFormat: { style: 'compact', decimals: 2 } }
        });
        // No axis-specific config, so uses global decimals: 2
        expect(chart.formatValue(1234567, null, 'axis')).toBe('1.23M');
        chart.destroy();
      });

      it('context can override style to full', () => {
        const chart = new BarChart(container, {
          data: { labels: ['A'], datasets: [{ values: [10] }] },
          style: { animation: { duration: 0 } },
          options: { numberFormat: { style: 'compact', tooltip: { style: 'full', decimals: 0 } } }
        });
        // Tooltip uses full format
        const result = chart.formatValue(2500000, null, 'tooltip');
        const digits = result.replace(/\D/g, '');
        expect(digits).toBe('2500000');
        // Axis still uses compact
        expect(chart.formatValue(2500000, null, 'axis')).toBe('2.5M');
        chart.destroy();
      });

      it('call-site decimals override context decimals', () => {
        const chart = new BarChart(container, {
          data: { labels: ['A'], datasets: [{ values: [10] }] },
          style: { animation: { duration: 0 } },
          options: { numberFormat: { style: 'compact', axis: { decimals: 2 } } }
        });
        // Call site decimals=0 should win over axis.decimals=2
        expect(chart.formatValue(2500000, 0, 'axis')).toBe('3M');
        chart.destroy();
      });

      it('unknown context falls back to global config', () => {
        const chart = new BarChart(container, {
          data: { labels: ['A'], datasets: [{ values: [10] }] },
          style: { animation: { duration: 0 } },
          options: { numberFormat: { style: 'compact', decimals: 2 } }
        });
        expect(chart.formatValue(1234567, null, 'other')).toBe('1.23M');
        chart.destroy();
      });
    });
  });
});
