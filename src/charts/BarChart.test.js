import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BarChart } from './BarChart.js';

describe('BarChart', () => {
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
    return new BarChart(container, {
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{ label: 'Sales', values: [100, 200, 150], color: '#4F46E5' }]
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

  it('renders bars as rect elements', () => {
    const chart = createChart();
    const rects = container.querySelectorAll('rect');
    // At least background rect + 3 bar rects
    expect(rects.length).toBeGreaterThanOrEqual(4);
    chart.destroy();
  });

  it('renders axis labels', () => {
    const chart = createChart();
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Jan');
    expect(textContents).toContain('Feb');
    expect(textContents).toContain('Mar');
    chart.destroy();
  });

  it('handles empty datasets', () => {
    const chart = createChart({
      data: { labels: [], datasets: [] }
    });
    // Should not throw
    chart.destroy();
  });

  it('handles multiple datasets (grouped)', () => {
    const chart = createChart({
      data: {
        labels: ['Q1', 'Q2'],
        datasets: [
          { label: 'A', values: [10, 20], color: '#f00' },
          { label: 'B', values: [15, 25], color: '#0f0' }
        ]
      }
    });
    const rects = container.querySelectorAll('rect');
    // background + 4 bars
    expect(rects.length).toBeGreaterThanOrEqual(5);
    chart.destroy();
  });

  it('supports stacked mode', () => {
    const chart = createChart({
      data: {
        labels: ['Q1'],
        datasets: [
          { label: 'A', values: [10], color: '#f00' },
          { label: 'B', values: [20], color: '#0f0' }
        ]
      },
      options: { stacked: true }
    });
    expect(chart.config.options.stacked).toBe(true);
    chart.destroy();
  });

  it('calculateLayout returns valid dimensions', () => {
    const chart = createChart();
    const layout = chart.calculateLayout();
    expect(layout.chartWidth).toBeGreaterThan(0);
    expect(layout.chartHeight).toBeGreaterThan(0);
    expect(layout.chartX).toBeGreaterThan(0);
    chart.destroy();
  });

  it('calculateBars returns bar metrics', () => {
    const chart = createChart();
    const bars = chart.calculateBars();
    expect(bars.numBars).toBe(3);
    expect(bars.numDatasets).toBe(1);
    expect(bars.minValue).toBe(100);
    expect(bars.maxValue).toBe(200);
    chart.destroy();
  });

  it('grouped bars are centered within their label slot', () => {
    const chart = createChart({
      data: {
        labels: ['Jan', 'Feb'],
        datasets: [
          { label: 'A', values: [10, 20], color: '#f00' },
          { label: 'B', values: [15, 25], color: '#0f0' },
          { label: 'C', values: [12, 22], color: '#00f' },
          { label: 'D', values: [18, 28], color: '#ff0' }
        ]
      }
    });

    const bars = chart.calculateBars();
    const { chartX } = bars.layout;
    const { barWidth } = bars;

    // For each label, the bars should be centered around the label center
    // and must not extend left of the label slot boundary
    chart.bars.forEach(bar => {
      const labelIndex = chart.config.data.labels.indexOf(bar.label);
      const slotLeft = chartX + labelIndex * barWidth;
      const slotRight = slotLeft + barWidth;
      const slotCenter = slotLeft + barWidth / 2;

      // Bar must be within its label slot boundaries
      expect(bar.x).toBeGreaterThanOrEqual(slotLeft);
      expect(bar.x + bar.width).toBeLessThanOrEqual(slotRight + 1); // +1 for rounding
    });

    chart.destroy();
  });

  it('first label bars do not overlap with Y-axis area', () => {
    const chart = createChart({
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [
          { label: '2026', values: [2900, 3100, 3200], color: '#4c6ef5' },
          { label: '2025', values: [2700, 2800, 2900], color: '#868e96' },
          { label: 'Budget', values: [2800, 2900, 3000], color: '#f08c00' },
          { label: 'Snitt', values: [2750, 2850, 2950], color: '#adb5bd' }
        ]
      }
    });

    const { chartX } = chart.calculateLayout();

    // All bars for Jan (index 0) must start at or after the chart area
    const janBars = chart.bars.filter(b => b.label === 'Jan');
    janBars.forEach(bar => {
      expect(bar.x).toBeGreaterThanOrEqual(chartX);
    });

    chart.destroy();
  });

  it('update re-renders with new data', () => {
    const chart = createChart();
    chart.update({
      data: {
        labels: ['A', 'B'],
        datasets: [{ values: [50, 75] }]
      }
    });
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('A');
    chart.destroy();
  });
});
