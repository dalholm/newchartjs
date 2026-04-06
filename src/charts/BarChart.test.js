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
        datasets: [{ label: 'Sales', values: [100, 200, 150], color: '#4c6ef5' }]
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
    // background rect + highlight rects + bar rects + hitbox rects
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
    // background + highlight + bar rects + hitbox rects
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

    chart.bars.forEach(bar => {
      const labelIndex = chart.config.data.labels.indexOf(bar.label);
      const slotLeft = chartX + labelIndex * barWidth;
      const slotRight = slotLeft + barWidth;

      expect(bar.x).toBeGreaterThanOrEqual(slotLeft);
      expect(bar.x + bar.width).toBeLessThanOrEqual(slotRight + 1);
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

  // ═══ NEW FEATURE TESTS ═══

  describe('reference lines', () => {
    it('renders a reference line as a dashed SVG line', () => {
      const chart = createChart({
        options: {
          referenceLines: [
            { value: 150, label: 'Target', color: '#f08c00', dash: '6 4' }
          ]
        }
      });
      const lines = container.querySelectorAll('line');
      const dashedLines = Array.from(lines).filter(l =>
        l.getAttribute('stroke-dasharray') === '6 4'
      );
      expect(dashedLines.length).toBeGreaterThanOrEqual(1);
      chart.destroy();
    });

    it('renders reference line label text', () => {
      const chart = createChart({
        options: {
          referenceLines: [
            { value: 150, label: 'Target', color: '#f08c00' }
          ]
        }
      });
      const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
      expect(texts).toContain('Target');
      chart.destroy();
    });

    it('computes average reference line from first dataset', () => {
      const chart = createChart({
        options: {
          referenceLines: [
            { value: 'average', label: 'Snitt', color: '#868e96' }
          ]
        }
      });
      const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
      expect(texts).toContain('Snitt');
      chart.destroy();
    });

    it('renders label background pill when labelBackground is set', () => {
      const chart = createChart({
        options: {
          referenceLines: [
            { value: 150, label: 'Budget', color: '#f08c00', labelBackground: '#ffec99' }
          ]
        }
      });
      const rects = container.querySelectorAll('rect');
      const pillRect = Array.from(rects).find(r => r.getAttribute('fill') === '#ffec99');
      expect(pillRect).not.toBeUndefined();
      chart.destroy();
    });

    it('positions right-aligned label inside chart area', () => {
      const chart = createChart({
        options: {
          referenceLines: [
            { value: 150, label: 'Budget', color: '#f08c00', labelPosition: 'right' }
          ]
        }
      });
      const layout = chart.calculateLayout();
      const labelText = Array.from(container.querySelectorAll('text'))
        .find(t => t.textContent === 'Budget');
      expect(labelText).not.toBeUndefined();
      // text-anchor should be 'end' for right-aligned
      expect(labelText.getAttribute('text-anchor')).toBe('end');
      chart.destroy();
    });
  });

  describe('per-bar markers', () => {
    it('renders marker lines for each bar', () => {
      const chart = createChart({
        options: {
          barMarkers: [
            { values: [120, 180, 160], color: '#f08c00', strokeWidth: 2 }
          ]
        }
      });
      const lines = container.querySelectorAll('line');
      const orangeLines = Array.from(lines).filter(l =>
        l.getAttribute('stroke') === '#f08c00'
      );
      // One marker per label
      expect(orangeLines.length).toBe(3);
      chart.destroy();
    });

    it('marker lines span only the bar area width', () => {
      const chart = createChart({
        options: {
          barMarkers: [
            { values: [150, 180, 160], color: '#f08c00' }
          ]
        }
      });
      const bars = chart.calculateBars();
      const { chartX } = bars.layout;
      const { barWidth, availableWidth } = bars;

      const orangeLines = Array.from(container.querySelectorAll('line')).filter(l =>
        l.getAttribute('stroke') === '#f08c00'
      );

      orangeLines.forEach((line, i) => {
        const x1 = parseFloat(line.getAttribute('x1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const lineWidth = x2 - x1;
        // Marker width should equal availableWidth (bars area), not full barWidth
        expect(lineWidth).toBeCloseTo(availableWidth, 0);
      });

      chart.destroy();
    });

    it('skips null marker values', () => {
      const chart = createChart({
        options: {
          barMarkers: [
            { values: [120, null, 160], color: '#f08c00' }
          ]
        }
      });
      const orangeLines = Array.from(container.querySelectorAll('line')).filter(l =>
        l.getAttribute('stroke') === '#f08c00'
      );
      expect(orangeLines.length).toBe(2);
      chart.destroy();
    });
  });

  describe('column hover', () => {
    it('creates transparent hitbox rects on top of bars', () => {
      const chart = createChart();
      const rects = container.querySelectorAll('rect');
      const transparent = Array.from(rects).filter(r => r.getAttribute('fill') === 'transparent');
      // One hitbox per label
      expect(transparent.length).toBe(3);
      chart.destroy();
    });

    it('hitbox rects are the last rects in SVG (on top)', () => {
      const chart = createChart();
      const rects = Array.from(container.querySelectorAll('rect'));
      const transparent = rects.filter(r => r.getAttribute('fill') === 'transparent');
      // Last 3 rects should be the hitboxes
      const lastThree = rects.slice(-3);
      lastThree.forEach(r => {
        expect(r.getAttribute('fill')).toBe('transparent');
      });
      chart.destroy();
    });

    it('highlight rects start with opacity 0', () => {
      const chart = createChart();
      const rects = Array.from(container.querySelectorAll('rect'));
      const highlights = rects.filter(r =>
        r.getAttribute('fill') === '#4c6ef5' && r.getAttribute('opacity') === '0'
      );
      expect(highlights.length).toBe(3);
      chart.destroy();
    });
  });

  describe('legend visibility filtering', () => {
    it('calculateBars filters datasets by legend visibility', () => {
      const chart = createChart({
        data: {
          labels: ['Jan', 'Feb'],
          datasets: [
            { label: 'A', values: [10, 20], color: '#f00' },
            { label: 'B', values: [15, 25], color: '#0f0' }
          ]
        }
      });

      // Simulate hiding dataset B
      chart._legendVisibility = { 'A': true, 'B': false };
      const bars = chart.calculateBars();
      expect(bars.visibleDatasets.length).toBe(1);
      expect(bars.visibleDatasets[0].label).toBe('A');
      chart.destroy();
    });
  });

  // ═══ DRILL-DOWN TESTS ═══

  describe('drill-down', () => {
    const drillData = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{ label: 'Revenue', values: [100, 200, 150, 180] }],
      children: {
        Q1: {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [{ label: 'Revenue', values: [30, 40, 30] }]
        },
        Q2: {
          labels: ['Apr', 'May', 'Jun'],
          datasets: [{ label: 'Revenue', values: [60, 70, 70] }]
        }
      }
    };

    it('drill-down disabled by default', () => {
      const chart = createChart();
      expect(chart._drillManager).toBeNull();
      chart.destroy();
    });

    it('creates DrillDownManager when drillDown is enabled', () => {
      const chart = createChart({
        data: drillData,
        options: { drillDown: true }
      });
      expect(chart._drillManager).not.toBeNull();
      expect(chart._drillManager.currentLevel).toBe(0);
      chart.destroy();
    });

    it('drillDown triggers re-render with child data', async () => {
      const chart = createChart({
        data: drillData,
        options: { drillDown: true }
      });

      await chart._handleDrillDown('Q1');

      const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
      expect(texts).toContain('Jan');
      expect(texts).toContain('Feb');
      expect(texts).toContain('Mar');
      expect(texts).not.toContain('Q3');
      chart.destroy();
    });

    it('breadcrumb appears after drilling down', async () => {
      const chart = createChart({
        data: drillData,
        options: { drillDown: true }
      });

      await chart._handleDrillDown('Q1');
      const bc = container.querySelector('.newchart-breadcrumb');
      expect(bc).not.toBeNull();
      expect(bc.textContent).toContain('Q1');
      chart.destroy();
    });

    it('breadcrumb is hidden at root level', () => {
      const chart = createChart({
        data: drillData,
        options: { drillDown: true }
      });

      // Breadcrumb should be hidden at level 0
      const bc = container.querySelector('.newchart-breadcrumb');
      if (bc) {
        expect(bc.style.display).toBe('none');
      }
      chart.destroy();
    });

    it('drillUp returns to root data', async () => {
      const chart = createChart({
        data: drillData,
        options: { drillDown: true }
      });

      await chart._handleDrillDown('Q1');
      chart.drillUp(0);

      const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
      expect(texts).toContain('Q1');
      expect(texts).toContain('Q4');
      chart.destroy();
    });

    it('does not drill when label has no children and no callback', async () => {
      const chart = createChart({
        data: drillData,
        options: { drillDown: true }
      });

      const levelBefore = chart._drillManager.currentLevel;
      await chart._handleDrillDown('Q3'); // Q3 has no children
      expect(chart._drillManager.currentLevel).toBe(levelBefore);
      chart.destroy();
    });

    it('async onDrillDown callback works', async () => {
      const chart = createChart({
        data: {
          labels: ['A', 'B'],
          datasets: [{ label: 'Val', values: [10, 20] }]
        },
        options: {
          drillDown: true,
          onDrillDown: async ({ label }) => ({
            labels: [`${label}-1`, `${label}-2`],
            datasets: [{ label: 'Detail', values: [5, 5] }]
          })
        }
      });

      await chart._handleDrillDown('A');
      const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
      expect(texts).toContain('A-1');
      expect(texts).toContain('A-2');
      chart.destroy();
    });

    it('async onDrillDown failure does not change level', async () => {
      const chart = createChart({
        data: {
          labels: ['A', 'B'],
          datasets: [{ label: 'Val', values: [10, 20] }]
        },
        options: {
          drillDown: true,
          onDrillDown: async () => { throw new Error('fail'); }
        }
      });

      await chart._handleDrillDown('A');
      expect(chart._drillManager.currentLevel).toBe(0);
      chart.destroy();
    });

    it('destroy cleans up breadcrumb and manager', async () => {
      const chart = createChart({
        data: drillData,
        options: { drillDown: true }
      });

      await chart._handleDrillDown('Q1');
      chart.destroy();
      expect(chart._drillManager).toBeNull();
      expect(chart._breadcrumb).toBeNull();
    });

    it('custom rootLabel appears in breadcrumb', async () => {
      const chart = createChart({
        data: drillData,
        options: { drillDown: true, drillDownRootLabel: 'Revenue' }
      });

      await chart._handleDrillDown('Q1');
      const bc = container.querySelector('.newchart-breadcrumb');
      expect(bc.textContent).toContain('Revenue');
      chart.destroy();
    });
  });
});
