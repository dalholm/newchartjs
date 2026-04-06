import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SankeyChart } from './SankeyChart.js';

describe('SankeyChart', () => {
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
    return new SankeyChart(container, {
      data: {
        nodes: [
          { id: 'A', label: 'Source A' },
          { id: 'B', label: 'Source B' },
          { id: 'C', label: 'Target C' }
        ],
        links: [
          { source: 'A', target: 'C', value: 100 },
          { source: 'B', target: 'C', value: 50 }
        ],
        datasets: []
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

  it('renders path elements for links', () => {
    const chart = createChart();
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
    chart.destroy();
  });

  it('renders rect elements for nodes', () => {
    const chart = createChart();
    const rects = container.querySelectorAll('rect');
    // background + 3 node rects
    expect(rects.length).toBeGreaterThanOrEqual(4);
    chart.destroy();
  });

  it('renders node labels', () => {
    const chart = createChart();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Source A');
    expect(texts).toContain('Source B');
    expect(texts).toContain('Target C');
    chart.destroy();
  });

  it('calculateLayout assigns layers to nodes', () => {
    const chart = createChart();
    const { nodes } = chart.calculateLayout();
    const sourceA = nodes.find(n => n.id === 'A');
    const targetC = nodes.find(n => n.id === 'C');
    expect(sourceA.layer).toBeLessThan(targetC.layer);
    chart.destroy();
  });

  it('calculateLayout computes node values', () => {
    const chart = createChart();
    const { nodes } = chart.calculateLayout();
    const targetC = nodes.find(n => n.id === 'C');
    expect(targetC.value).toBe(150); // 100 + 50
    chart.destroy();
  });

  it('handles empty data', () => {
    const chart = createChart({
      data: { nodes: [], links: [], datasets: [] }
    });
    chart.destroy();
  });

  it('stores _nodeElements and _linkElements', () => {
    const chart = createChart();
    expect(chart._nodeElements).toBeDefined();
    expect(chart._linkElements).toBeDefined();
    expect(chart._nodeElements.length).toBe(3);
    expect(chart._linkElements.length).toBe(2);
    chart.destroy();
  });

  it('handles multi-level flows', () => {
    const chart = createChart({
      data: {
        nodes: [
          { id: 'A', label: 'A' },
          { id: 'B', label: 'B' },
          { id: 'C', label: 'C' }
        ],
        links: [
          { source: 'A', target: 'B', value: 100 },
          { source: 'B', target: 'C', value: 80 }
        ],
        datasets: []
      }
    });
    const { nodes } = chart.calculateLayout();
    expect(nodes.find(n => n.id === 'A').layer).toBe(0);
    expect(nodes.find(n => n.id === 'B').layer).toBe(1);
    expect(nodes.find(n => n.id === 'C').layer).toBe(2);
    chart.destroy();
  });
});
