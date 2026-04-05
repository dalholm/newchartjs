/**
 * DataTable component — auto-generated data table that syncs hover with charts.
 *
 * Integrated into Chart base class via options.table config:
 *   options: {
 *     table: {
 *       enabled: true,
 *       viewMode: 'split',    // 'chart' | 'table' | 'split'
 *       columns: [...],       // optional custom columns
 *       maxHeight: 200,       // max height in split mode (scrollable)
 *     }
 *   }
 */

import { createElement } from './utils.js';

export class DataTable {
  /**
   * @param {Element} container - Parent element to mount into
   * @param {Object} options - Table configuration
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      enabled: true,
      viewMode: 'split',
      maxHeight: 200,
      columns: null,
      fontFamily: 'inherit',
      monoFamily: 'monospace',
      ...options
    };

    this.element = null;
    this._onRowHover = null;
    this._onRowLeave = null;
    this._rows = [];
  }

  /**
   * Build table from chart data
   * @param {Object} chartData - { labels, datasets } from chart config
   * @param {Object} [extra] - Extra config { columns, formatValue, colors }
   */
  setData(chartData, extra = {}) {
    const { labels = [], datasets = [] } = chartData;
    const columns = extra.columns || this.options.columns || this._autoColumns(datasets);
    const colors = extra.colors || datasets.map((ds, i) => ds.color || null);

    this._rows = labels.map((label, i) => {
      const row = { _index: i, _label: label };
      datasets.forEach((ds, di) => {
        const key = ds.label || ds.key || `series_${di}`;
        row[key] = ds.values?.[i] ?? null;
        row[`_color_${di}`] = colors[di];
      });
      return row;
    });

    this._columns = columns;
    this._datasets = datasets;
    this._render();
  }

  /**
   * Generate columns automatically from datasets
   */
  _autoColumns(datasets) {
    const cols = [{ key: '_label', label: 'Period', align: 'left' }];
    datasets.forEach((ds) => {
      const key = ds.label || ds.key || 'Value';
      cols.push({
        key,
        label: ds.label || 'Value',
        align: 'right',
        mono: true
      });
    });
    return cols;
  }

  /**
   * Set hover callback (called when table row is hovered)
   * @param {Function} onHover - (index) => void
   * @param {Function} onLeave - () => void
   */
  onHover(onHover, onLeave) {
    this._onRowHover = onHover;
    this._onRowLeave = onLeave;
  }

  /**
   * Highlight a row by index (called from chart hover)
   * @param {number} index - Row index
   */
  highlightRow(index) {
    if (!this.element) return;
    const rows = this.element.querySelectorAll('tr[data-row]');
    rows.forEach(r => {
      r.classList.toggle('hovered', parseInt(r.dataset.row) === index);
    });
  }

  /**
   * Clear all row highlights
   */
  clearHighlight() {
    if (!this.element) return;
    const rows = this.element.querySelectorAll('tr[data-row]');
    rows.forEach(r => r.classList.remove('hovered'));
  }

  /**
   * Mount or update the table element
   */
  _render() {
    const isSplit = this.options.viewMode === 'split';

    if (!this.element) {
      this.element = createElement('div', {
        class: 'newchart-datatable',
        style: {
          border: '1px solid #ebecf0',
          borderRadius: '4px',
          overflow: 'hidden',
          marginTop: isSplit ? '12px' : '0',
          maxHeight: isSplit ? this.options.maxHeight + 'px' : 'none',
          overflowY: isSplit ? 'auto' : 'visible'
        }
      });
      this.container.appendChild(this.element);
    }

    // Update split styling
    this.element.style.marginTop = isSplit ? '12px' : '0';
    this.element.style.maxHeight = isSplit ? this.options.maxHeight + 'px' : 'none';
    this.element.style.overflowY = isSplit ? 'auto' : 'visible';

    const table = document.createElement('table');
    Object.assign(table.style, {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '12px',
      fontFamily: this.options.fontFamily
    });

    // Head
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    this._columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.label;
      Object.assign(th.style, {
        textAlign: col.align || 'left',
        padding: '8px 10px',
        color: '#8993a4',
        fontWeight: '500',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '2px solid #dfe1e6',
        background: '#f8f9fb',
        position: 'sticky',
        top: '0',
        whiteSpace: 'nowrap',
        zIndex: '1'
      });
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    this._rows.forEach((row, ri) => {
      const tr = document.createElement('tr');
      tr.dataset.row = ri;
      Object.assign(tr.style, {
        transition: 'background 0.08s',
        cursor: 'pointer',
        background: ri % 2 === 0 ? '#ffffff' : '#f8f9fb',
        borderBottom: '1px solid #ebecf0'
      });

      this._columns.forEach((col, ci) => {
        const td = document.createElement('td');
        Object.assign(td.style, {
          padding: '7px 10px',
          textAlign: col.align || 'left',
          fontFamily: col.mono ? this.options.monoFamily : 'inherit',
          fontWeight: ci === 0 ? '500' : '400',
          color: ci === 0 ? '#172b4d' : '#5e6c84'
        });

        const value = row[col.key];
        if (col.render) {
          td.innerHTML = col.render(row, ri);
        } else if (value != null && typeof value === 'number') {
          td.textContent = value.toLocaleString('sv-SE');
        } else {
          td.textContent = value ?? '';
        }

        tr.appendChild(td);
      });

      // Hover events: table → chart
      tr.addEventListener('mouseenter', () => {
        this.highlightRow(ri);
        if (this._onRowHover) this._onRowHover(ri);
      });
      tr.addEventListener('mouseleave', () => {
        this.clearHighlight();
        if (this._onRowLeave) this._onRowLeave();
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    // Add CSS for hover state
    if (!document.getElementById('newchart-datatable-styles')) {
      const style = document.createElement('style');
      style.id = 'newchart-datatable-styles';
      style.textContent = '.newchart-datatable tr.hovered { background: #edf2ff !important; }';
      document.head.appendChild(style);
    }

    this.element.innerHTML = '';
    this.element.appendChild(table);
  }

  /**
   * Update view mode
   * @param {string} mode - 'chart' | 'table' | 'split'
   */
  setViewMode(mode) {
    this.options.viewMode = mode;

    if (!this.element) return;

    if (mode === 'chart') {
      this.element.style.display = 'none';
    } else {
      this.element.style.display = '';
      const isSplit = mode === 'split';
      this.element.style.marginTop = isSplit ? '12px' : '0';
      this.element.style.maxHeight = isSplit ? this.options.maxHeight + 'px' : 'none';
      this.element.style.overflowY = isSplit ? 'auto' : 'visible';
    }
  }

  /**
   * Show table
   */
  show() {
    if (this.element) this.element.style.display = '';
  }

  /**
   * Hide table
   */
  hide() {
    if (this.element) this.element.style.display = 'none';
  }

  /**
   * Destroy table
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

export default DataTable;
