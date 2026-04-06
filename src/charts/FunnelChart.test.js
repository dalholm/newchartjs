import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FunnelChart } from './FunnelChart.js';

describe('FunnelChart', () => {
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
    return new FunnelChart(container, {
      data: {
        labels: ['Visits', 'Views', 'Cart', 'Purchase'],
        datasets: [{ values: [10000, 6000, 3000, 1500] }]
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

  it('renders path elements for each stage', () => {
    const chart = createChart();
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(4);
    chart.destroy();
  });

  it('renders stage labels', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Visits');
    expect(texts).toContain('Purchase');
    chart.destroy();
  });

  it('calculateStages returns correct stage count', () => {
    const chart = createChart();
    const stages = chart.calculateStages();
    expect(stages).toHaveLength(4);
    chart.destroy();
  });

  it('calculateStages computes drop-off percentages', () => {
    const chart = createChart();
    const stages = chart.calculateStages();
    expect(stages[0].dropOff).toBe(0); // first stage has no drop-off
    expect(stages[1].dropOff).toBeCloseTo(40, 0); // 10000 -> 6000 = 40%
    chart.destroy();
  });

  it('calculateStages computes conversion rates', () => {
    const chart = createChart();
    const stages = chart.calculateStages();
    expect(stages[0].conversionRate).toBe(100);
    expect(stages[3].conversionRate).toBe(15); // 1500/10000
    chart.destroy();
  });

  it('handles empty datasets', () => {
    const chart = createChart({
      data: { labels: [], datasets: [{ values: [] }] }
    });
    chart.destroy();
  });

  it('handles single stage', () => {
    const chart = createChart({
      data: { labels: ['Only'], datasets: [{ values: [5000] }] }
    });
    const stages = chart.calculateStages();
    expect(stages).toHaveLength(1);
    chart.destroy();
  });

  it('stores _stageElements for hover interaction', () => {
    const chart = createChart();
    expect(chart._stageElements).toBeDefined();
    expect(chart._stageElements.length).toBe(4);
    chart.destroy();
  });

  it('calls onClick when a stage is clicked', () => {
    const onClick = vi.fn();
    const chart = createChart({ options: { onClick } });
    const paths = container.querySelectorAll('path');
    paths[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({
      index: 0,
      label: 'Visits'
    }));
    chart.destroy();
  });

  it('update re-renders with new data', () => {
    const chart = createChart();
    chart.update({
      data: {
        labels: ['A', 'B'],
        datasets: [{ values: [500, 200] }]
      }
    });
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('A');
    chart.destroy();
  });
});
