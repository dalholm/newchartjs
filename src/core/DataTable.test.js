import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataTable } from './DataTable.js';

describe('DataTable', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      { label: '2026', values: [100, 200, 150], color: '#4c6ef5' },
      { label: '2025', values: [80, 160, 120], color: '#b3bac5' }
    ]
  };

  function createTable(opts = {}) {
    return new DataTable(container, { enabled: true, ...opts });
  }

  it('mounts a table element', () => {
    const dt = createTable();
    dt.setData(chartData);
    expect(container.querySelector('.newchart-datatable')).not.toBeNull();
    expect(container.querySelector('table')).not.toBeNull();
    dt.destroy();
  });

  it('renders correct number of body rows', () => {
    const dt = createTable();
    dt.setData(chartData);
    const rows = container.querySelectorAll('tr[data-row]');
    expect(rows.length).toBe(3);
    dt.destroy();
  });

  it('renders header with auto-generated columns', () => {
    const dt = createTable();
    dt.setData(chartData);
    const ths = container.querySelectorAll('th');
    expect(ths.length).toBe(3); // Period, 2026, 2025
    expect(ths[0].textContent).toBe('Period');
    expect(ths[1].textContent).toBe('2026');
    expect(ths[2].textContent).toBe('2025');
    dt.destroy();
  });

  it('renders label cells in first column', () => {
    const dt = createTable();
    dt.setData(chartData);
    const rows = container.querySelectorAll('tr[data-row]');
    expect(rows[0].children[0].textContent).toBe('Jan');
    expect(rows[1].children[0].textContent).toBe('Feb');
    expect(rows[2].children[0].textContent).toBe('Mar');
    dt.destroy();
  });

  it('renders numeric values formatted', () => {
    const dt = createTable();
    dt.setData(chartData);
    const rows = container.querySelectorAll('tr[data-row]');
    // Second column should have the 2026 value for Jan
    const janValue = rows[0].children[1].textContent;
    expect(janValue).toContain('100');
    dt.destroy();
  });

  it('supports custom columns', () => {
    const dt = createTable({
      columns: [
        { key: '_label', label: 'Månad', align: 'left' },
        { key: '2026', label: 'Intäkt', align: 'right', mono: true }
      ]
    });
    dt.setData(chartData);
    const ths = container.querySelectorAll('th');
    expect(ths.length).toBe(2);
    expect(ths[0].textContent).toBe('Månad');
    expect(ths[1].textContent).toBe('Intäkt');
    dt.destroy();
  });

  describe('hover sync', () => {
    it('highlightRow adds hovered class to correct row', () => {
      const dt = createTable();
      dt.setData(chartData);
      dt.highlightRow(1);
      const rows = container.querySelectorAll('tr[data-row]');
      expect(rows[0].classList.contains('hovered')).toBe(false);
      expect(rows[1].classList.contains('hovered')).toBe(true);
      expect(rows[2].classList.contains('hovered')).toBe(false);
      dt.destroy();
    });

    it('clearHighlight removes all hovered classes', () => {
      const dt = createTable();
      dt.setData(chartData);
      dt.highlightRow(1);
      dt.clearHighlight();
      const rows = container.querySelectorAll('tr[data-row]');
      rows.forEach(r => {
        expect(r.classList.contains('hovered')).toBe(false);
      });
      dt.destroy();
    });

    it('calls onHover callback when row is mouseentered', () => {
      const onHover = vi.fn();
      const onLeave = vi.fn();
      const dt = createTable();
      dt.onHover(onHover, onLeave);
      dt.setData(chartData);

      const rows = container.querySelectorAll('tr[data-row]');
      rows[2].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      expect(onHover).toHaveBeenCalledWith(2);

      rows[2].dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      expect(onLeave).toHaveBeenCalled();
      dt.destroy();
    });
  });

  describe('view modes', () => {
    it('setViewMode chart hides the table', () => {
      const dt = createTable();
      dt.setData(chartData);
      dt.setViewMode('chart');
      expect(dt.element.style.display).toBe('none');
      dt.destroy();
    });

    it('setViewMode table shows without max-height', () => {
      const dt = createTable();
      dt.setData(chartData);
      dt.setViewMode('table');
      expect(dt.element.style.display).not.toBe('none');
      expect(dt.element.style.maxHeight).toBe('none');
      dt.destroy();
    });

    it('setViewMode split shows with max-height and margin', () => {
      const dt = createTable({ maxHeight: 150 });
      dt.setData(chartData);
      dt.setViewMode('split');
      expect(dt.element.style.maxHeight).toBe('150px');
      expect(dt.element.style.marginTop).toBe('12px');
      dt.destroy();
    });
  });

  it('destroy removes element from DOM', () => {
    const dt = createTable();
    dt.setData(chartData);
    expect(container.querySelector('.newchart-datatable')).not.toBeNull();
    dt.destroy();
    expect(container.querySelector('.newchart-datatable')).toBeNull();
  });
});
