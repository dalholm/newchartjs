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
});
