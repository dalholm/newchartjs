import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GaugeChart } from './GaugeChart.js';

describe('GaugeChart', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '400px';
    container.style.height = '300px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function createChart(config = {}) {
    return new GaugeChart(container, {
      data: {
        datasets: [{ label: 'Progress', values: [75] }]
      },
      options: { min: 0, max: 100 },
      style: { animation: { duration: 0 } },
      ...config
    });
  }

  it('creates an SVG element', () => {
    const chart = createChart();
    expect(container.querySelector('svg')).not.toBeNull();
    chart.destroy();
  });

  it('renders arc paths for track and value zones', () => {
    const chart = createChart();
    const paths = container.querySelectorAll('path');
    // Track + zone fills + needle
    expect(paths.length).toBeGreaterThanOrEqual(2);
    chart.destroy();
  });

  it('renders center value text', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('75');
    chart.destroy();
  });

  it('renders label text', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Progress');
    chart.destroy();
  });

  it('renders tick marks', () => {
    const chart = createChart({ options: { min: 0, max: 100, ticks: 5 } });
    const lines = container.querySelectorAll('line');
    // 6 tick lines (0, 20, 40, 60, 80, 100)
    expect(lines.length).toBeGreaterThanOrEqual(6);
    chart.destroy();
  });

  it('renders target marker when target is set', () => {
    const chart = createChart({
      options: { min: 0, max: 100, target: 90 }
    });
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    // Should have target label
    const hasTarget = texts.some(t => t.includes('90'));
    expect(hasTarget).toBe(true);
    chart.destroy();
  });

  it('renders needle by default', () => {
    const chart = createChart();
    // Needle is a triangle path + center circle
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(1);
    chart.destroy();
  });

  it('hides needle when needle: false', () => {
    const chart = createChart({
      style: { gauge: { needle: false }, animation: { duration: 0 } }
    });
    // No needle triangle or center dot beyond tick marks
    const paths = container.querySelectorAll('path');
    const circles = container.querySelectorAll('circle');
    // Should have fewer elements
    const needleChart = createChart();
    const needlePaths = needleChart.element.querySelectorAll('path').length;
    expect(paths.length).toBeLessThan(needlePaths);
    chart.destroy();
    needleChart.destroy();
  });

  it('applies custom valueSuffix', () => {
    const chart = createChart({
      options: { min: 0, max: 100, valueSuffix: '%' }
    });
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('75%');
    chart.destroy();
  });

  it('applies custom formatValue function', () => {
    const chart = createChart({
      data: { datasets: [{ label: 'Test', values: [42.5] }] },
      options: {
        min: 0, max: 100,
        formatValue: (v) => v.toFixed(1) + ' MSEK'
      }
    });
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('42.5 MSEK');
    chart.destroy();
  });

  it('uses inverted zones correctly', () => {
    const chart = createChart({
      data: { datasets: [{ label: 'Capacity', values: [90] }] },
      options: {
        min: 0, max: 100,
        zones: [
          { from: 0, to: 0.6, color: '#0ca678' },
          { from: 0.6, to: 0.85, color: '#f08c00' },
          { from: 0.85, to: 1.0, color: '#e03131' }
        ]
      }
    });
    // Value 90 is in the red zone (0.85-1.0)
    const valueText = Array.from(container.querySelectorAll('text'))
      .find(t => t.textContent === '90');
    expect(valueText).not.toBeUndefined();
    expect(valueText.getAttribute('fill')).toBe('#e03131');
    chart.destroy();
  });

  it('handles empty dataset gracefully', () => {
    const chart = createChart({
      data: { datasets: [] }
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
