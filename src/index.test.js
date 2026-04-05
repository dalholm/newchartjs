import { describe, it, expect, beforeEach } from 'vitest';
import NewChart from './index.js';

describe('NewChart', () => {
  it('has version string', () => {
    expect(NewChart.version).toBe('0.1.0');
  });

  it('exports chart classes', () => {
    expect(NewChart.BarChart).toBeDefined();
    expect(NewChart.PieChart).toBeDefined();
    expect(NewChart.LineChart).toBeDefined();
  });

  describe('create', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
      container.style.width = '600px';
      container.style.height = '400px';
      document.body.appendChild(container);
    });

    it('throws on unknown chart type', () => {
      expect(() => {
        NewChart.create(container, { type: 'unknown' });
      }).toThrow('Unknown chart type: unknown');
    });

    it('defaults to bar chart', () => {
      const chart = NewChart.create(container, {
        data: { labels: ['A'], datasets: [{ values: [1] }] }
      });
      expect(chart).toBeInstanceOf(NewChart.BarChart);
      chart.destroy();
    });

    it('creates a bar chart', () => {
      const chart = NewChart.create(container, {
        type: 'bar',
        data: { labels: ['A'], datasets: [{ values: [1] }] }
      });
      expect(chart).toBeInstanceOf(NewChart.BarChart);
      chart.destroy();
    });

    it('creates a line chart', () => {
      const chart = NewChart.create(container, {
        type: 'line',
        data: { labels: ['A', 'B'], datasets: [{ values: [1, 2] }] }
      });
      expect(chart).toBeInstanceOf(NewChart.LineChart);
      chart.destroy();
    });

    it('creates a pie chart', () => {
      const chart = NewChart.create(container, {
        type: 'pie',
        data: { labels: ['A', 'B'], datasets: [{ values: [60, 40] }] }
      });
      expect(chart).toBeInstanceOf(NewChart.PieChart);
      chart.destroy();
    });

    it('accepts selector string', () => {
      container.id = 'test-chart';
      const chart = NewChart.create('#test-chart', {
        type: 'bar',
        data: { labels: ['A'], datasets: [{ values: [1] }] }
      });
      expect(chart).toBeInstanceOf(NewChart.BarChart);
      chart.destroy();
    });

    it('is case insensitive for type', () => {
      const chart = NewChart.create(container, {
        type: 'BAR',
        data: { labels: ['A'], datasets: [{ values: [1] }] }
      });
      expect(chart).toBeInstanceOf(NewChart.BarChart);
      chart.destroy();
    });
  });
});
