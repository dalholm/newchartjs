import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BarChart } from '../charts/BarChart.js';

describe('Theme reactivity', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '600px';
    container.style.height = '400px';
    document.body.appendChild(container);
    // Clean up any inline styles on <html>
    document.documentElement.removeAttribute('style');
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('style');
    document.documentElement.classList.remove('dark');
  });

  function createChart(config = {}) {
    return new BarChart(container, {
      data: { labels: ['A', 'B'], datasets: [{ values: [10, 20] }, { values: [15, 25] }] },
      style: { animation: { duration: 0 } },
      ...config
    });
  }

  describe('MutationObserver setup', () => {
    it('creates html observer for class and style changes', () => {
      const chart = createChart();
      expect(chart._htmlObserver).not.toBeNull();
      chart.destroy();
    });

    it('creates element style observer', () => {
      const chart = createChart();
      expect(chart._elementStyleObserver).not.toBeNull();
      chart.destroy();
    });

    it('does not create observers when cssTokens is false', () => {
      const chart = createChart({ options: { cssTokens: false } });
      expect(chart._htmlObserver).toBeNull();
      expect(chart._elementStyleObserver).toBeNull();
      chart.destroy();
    });
  });

  describe('palette from CSS tokens', () => {
    it('uses default palette when no CSS tokens are set', () => {
      const chart = createChart();
      const color = chart.getPaletteColor(0);
      expect(color).toBe('#4c6ef5');
      chart.destroy();
    });

    it('reads palette from --nc-palette-* CSS tokens on the element', () => {
      container.style.setProperty('--nc-palette-1', '#ff0000');
      container.style.setProperty('--nc-palette-2', '#00ff00');
      const chart = createChart();
      const color0 = chart.getPaletteColor(0);
      const color1 = chart.getPaletteColor(1);
      expect(color0).toBe('#ff0000');
      expect(color1).toBe('#00ff00');
      chart.destroy();
    });

    it('reads palette tokens set directly on the chart element', () => {
      // Note: jsdom does not cascade CSS custom properties from :root to children.
      // In real browsers, tokens set on :root via theme.js cascade to all elements.
      // Here we test the direct element case.
      container.style.setProperty('--nc-palette-1', '#aabbcc');
      container.style.setProperty('--nc-palette-2', '#ddeeff');
      const chart = createChart();
      expect(chart.getPaletteColor(0)).toBe('#aabbcc');
      expect(chart.getPaletteColor(1)).toBe('#ddeeff');
      chart.destroy();
    });
  });

  describe('dark mode detection', () => {
    it('detects dark mode from --nc-theme CSS token', () => {
      container.style.setProperty('--nc-theme', 'dark');
      const chart = createChart();
      expect(chart._dark).toBe(true);
      chart.destroy();
    });

    it('detects dark mode from options.theme', () => {
      const chart = createChart({ options: { theme: 'dark' } });
      expect(chart._dark).toBe(true);
      chart.destroy();
    });

    it('defaults to light mode without dark indicators', () => {
      const chart = createChart();
      expect(chart._dark).toBe(false);
      chart.destroy();
    });

    it('html.dark class is detected reactively by observer (not at init)', () => {
      // At init time, the chart only checks options.theme and --nc-theme token
      // The html.dark class is detected by the MutationObserver callback
      document.documentElement.classList.add('dark');
      const chart = createChart();
      // Without --nc-theme token, dark class is NOT detected at init
      expect(chart._dark).toBe(false);
      chart.destroy();
    });
  });

  describe('_applyTheme', () => {
    it('applies dark palette when dark mode is active via token', () => {
      container.style.setProperty('--nc-theme', 'dark');
      const chart = createChart();
      expect(chart._dark).toBe(true);
      // Dark palette has different first color
      const darkColor = chart.getPaletteColor(0);
      expect(darkColor).not.toBe('#4c6ef5');
      chart.destroy();
    });

    it('re-resolves CSS tokens on theme apply', () => {
      const chart = createChart();
      // Set a token and manually re-apply
      container.style.setProperty('--nc-palette-1', '#123456');
      chart._applyTheme(chart._userConfig);
      expect(chart.getPaletteColor(0)).toBe('#123456');
      chart.destroy();
    });

    it('user config palette takes priority over dark defaults', () => {
      document.documentElement.classList.add('dark');
      const chart = createChart({ palette: ['#aaa', '#bbb'] });
      expect(chart.getPaletteColor(0)).toBe('#aaa');
      chart.destroy();
    });

    it('CSS token palette takes priority over all', () => {
      document.documentElement.classList.add('dark');
      container.style.setProperty('--nc-palette-1', '#custom1');
      const chart = createChart({ palette: ['#user1'] });
      expect(chart.getPaletteColor(0)).toBe('#custom1');
      chart.destroy();
    });
  });

  describe('destroy cleanup', () => {
    it('disconnects html observer on destroy', () => {
      const chart = createChart();
      const spy = vi.spyOn(chart._htmlObserver, 'disconnect');
      chart.destroy();
      expect(spy).toHaveBeenCalled();
    });

    it('disconnects element style observer on destroy', () => {
      const chart = createChart();
      const spy = vi.spyOn(chart._elementStyleObserver, 'disconnect');
      chart.destroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getPaletteColor wrapping', () => {
    it('wraps around palette length', () => {
      container.style.setProperty('--nc-palette-1', '#aa0000');
      container.style.setProperty('--nc-palette-2', '#00aa00');
      const chart = createChart();
      expect(chart.getPaletteColor(0)).toBe('#aa0000');
      expect(chart.getPaletteColor(1)).toBe('#00aa00');
      expect(chart.getPaletteColor(2)).toBe('#aa0000'); // wraps
      chart.destroy();
    });
  });
});
