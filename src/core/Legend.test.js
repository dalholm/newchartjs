import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Legend } from './Legend.js';

describe('Legend', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  const items = [
    { key: 'a', label: 'Series A', color: '#4c6ef5' },
    { key: 'b', label: 'Series B', color: '#0ca678' },
    { key: 'c', label: 'Series C', color: '#f08c00', style: 'dashed', ref: true }
  ];

  function createLegend(opts = {}) {
    return new Legend(container, items, { enabled: true, ...opts });
  }

  it('mounts legend to container', () => {
    const legend = createLegend();
    legend.mount();
    expect(container.querySelector('.newchart-legend')).not.toBeNull();
    legend.destroy();
  });

  it('renders one item per entry', () => {
    const legend = createLegend();
    legend.mount();
    const children = legend.element.children;
    expect(children.length).toBe(3);
    legend.destroy();
  });

  it('displays item labels', () => {
    const legend = createLegend();
    legend.mount();
    expect(legend.element.textContent).toContain('Series A');
    expect(legend.element.textContent).toContain('Series B');
    legend.destroy();
  });

  it('shows (ref) tag for dashed/ref items', () => {
    const legend = createLegend();
    legend.mount();
    expect(legend.element.textContent).toContain('(ref)');
    legend.destroy();
  });

  it('all items start visible', () => {
    const legend = createLegend();
    legend.mount();
    expect(legend.isVisible('a')).toBe(true);
    expect(legend.isVisible('b')).toBe(true);
    expect(legend.isVisible('c')).toBe(true);
    legend.destroy();
  });

  describe('toggle visibility', () => {
    it('clicking toggles visibility state', () => {
      const legend = createLegend();
      legend.mount();

      // Click first item to hide it
      legend.element.children[0].click();
      expect(legend.isVisible('a')).toBe(false);

      // Click again to show it
      legend.element.children[0].click();
      expect(legend.isVisible('a')).toBe(true);
      legend.destroy();
    });

    it('calls onToggle callback with key, state, and full map', () => {
      const onToggle = vi.fn();
      const legend = createLegend({ onToggle });
      legend.mount();

      legend.element.children[1].click();

      expect(onToggle).toHaveBeenCalledWith('b', false, expect.objectContaining({
        a: true,
        b: false,
        c: true
      }));
      legend.destroy();
    });

    it('getVisibility returns full map', () => {
      const legend = createLegend();
      legend.mount();

      legend.element.children[0].click(); // hide a

      const vis = legend.getVisibility();
      expect(vis).toEqual({ a: false, b: true, c: true });
      legend.destroy();
    });

    it('setVisibility programmatically updates state', () => {
      const legend = createLegend();
      legend.mount();

      legend.setVisibility('b', false);
      expect(legend.isVisible('b')).toBe(false);
      legend.destroy();
    });
  });

  describe('non-interactive mode', () => {
    it('does not toggle on click when interactive is false', () => {
      const legend = createLegend({ interactive: false });
      legend.mount();

      legend.element.children[0].click();
      expect(legend.isVisible('a')).toBe(true); // unchanged
      legend.destroy();
    });
  });

  describe('visual states', () => {
    it('hidden item has reduced opacity', () => {
      const legend = createLegend();
      legend.mount();

      legend.element.children[0].click(); // hide 'a'

      const hiddenItem = legend.element.children[0];
      expect(hiddenItem.style.opacity).toBe('0.5');
      legend.destroy();
    });

    it('visible item has full opacity', () => {
      const legend = createLegend();
      legend.mount();

      const item = legend.element.children[0];
      expect(item.style.opacity).toBe('1');
      legend.destroy();
    });
  });

  describe('update', () => {
    it('updates items while preserving visibility', () => {
      const legend = createLegend();
      legend.mount();

      legend.element.children[0].click(); // hide 'a'

      legend.update([
        { key: 'a', label: 'Updated A', color: '#f00' },
        { key: 'b', label: 'Series B', color: '#0f0' },
        { key: 'd', label: 'New D', color: '#00f' }
      ]);

      expect(legend.isVisible('a')).toBe(false); // preserved
      expect(legend.isVisible('b')).toBe(true);
      expect(legend.isVisible('d')).toBe(true); // new item defaults to visible
      legend.destroy();
    });
  });

  describe('positioning', () => {
    it('top position uses flex-row and center justify', () => {
      const legend = createLegend({ position: 'top' });
      legend.mount();
      expect(legend.element.style.justifyContent).toBe('center');
      legend.destroy();
    });

    it('left position uses flex-column', () => {
      const legend = createLegend({ position: 'left' });
      legend.mount();
      expect(legend.element.style.flexDirection).toBe('column');
      legend.destroy();
    });
  });

  it('destroy removes element from DOM', () => {
    const legend = createLegend();
    legend.mount();
    expect(container.querySelector('.newchart-legend')).not.toBeNull();
    legend.destroy();
    expect(container.querySelector('.newchart-legend')).toBeNull();
  });
});
