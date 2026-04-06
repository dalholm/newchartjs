import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Breadcrumb } from './Breadcrumb.js';

describe('Breadcrumb', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('mount creates DOM element in container', () => {
    const bc = new Breadcrumb(container);
    bc.mount();
    expect(container.querySelector('.newchart-breadcrumb')).not.toBeNull();
    bc.destroy();
  });

  it('renders items with separators', () => {
    const bc = new Breadcrumb(container);
    bc.mount();
    bc.update([
      { label: 'Root', level: 0 },
      { label: 'Q1', level: 1 },
      { label: 'January', level: 2 }
    ]);

    const spans = bc.element.querySelectorAll('span');
    // 3 labels + 2 separators = 5 spans
    expect(spans.length).toBe(5);
    expect(spans[0].textContent).toBe('Root');
    expect(spans[1].textContent).toBe(' › ');
    expect(spans[2].textContent).toBe('Q1');
    expect(spans[3].textContent).toBe(' › ');
    expect(spans[4].textContent).toBe('January');
    bc.destroy();
  });

  it('last item is not clickable', () => {
    const onClick = vi.fn();
    const bc = new Breadcrumb(container, { onClick });
    bc.mount();
    bc.update([
      { label: 'Root', level: 0 },
      { label: 'Q1', level: 1 }
    ]);

    const spans = bc.element.querySelectorAll('span');
    const lastLabel = spans[spans.length - 1]; // 'Q1'
    expect(lastLabel.style.cursor).toBe('default');
    lastLabel.click();
    expect(onClick).not.toHaveBeenCalled();
    bc.destroy();
  });

  it('clicking non-last item fires onClick with level', () => {
    const onClick = vi.fn();
    const bc = new Breadcrumb(container, { onClick });
    bc.mount();
    bc.update([
      { label: 'Root', level: 0 },
      { label: 'Q1', level: 1 },
      { label: 'Jan', level: 2 }
    ]);

    const spans = bc.element.querySelectorAll('span');
    spans[0].click(); // 'Root'
    expect(onClick).toHaveBeenCalledWith(0);

    spans[2].click(); // 'Q1'
    expect(onClick).toHaveBeenCalledWith(1);
    bc.destroy();
  });

  it('update replaces items', () => {
    const bc = new Breadcrumb(container);
    bc.mount();
    bc.update([{ label: 'Root', level: 0 }, { label: 'A', level: 1 }]);
    expect(bc.element.textContent).toContain('A');

    bc.update([{ label: 'Root', level: 0 }, { label: 'B', level: 1 }]);
    expect(bc.element.textContent).toContain('B');
    expect(bc.element.textContent).not.toContain('A');
    bc.destroy();
  });

  it('destroy removes element from DOM', () => {
    const bc = new Breadcrumb(container);
    bc.mount();
    expect(container.querySelector('.newchart-breadcrumb')).not.toBeNull();
    bc.destroy();
    expect(container.querySelector('.newchart-breadcrumb')).toBeNull();
    expect(bc.element).toBeNull();
  });

  it('hidden when only single item (root)', () => {
    const bc = new Breadcrumb(container);
    bc.mount();
    bc.update([{ label: 'Root', level: 0 }]);
    expect(bc.element.style.display).toBe('none');
    bc.destroy();
  });

  it('shown when multiple items', () => {
    const bc = new Breadcrumb(container);
    bc.mount();
    bc.update([{ label: 'Root', level: 0 }, { label: 'Q1', level: 1 }]);
    expect(bc.element.style.display).toBe('flex');
    bc.destroy();
  });

  it('mounts automatically on first update if not mounted', () => {
    const bc = new Breadcrumb(container);
    bc.update([{ label: 'Root', level: 0 }, { label: 'Q1', level: 1 }]);
    expect(container.querySelector('.newchart-breadcrumb')).not.toBeNull();
    bc.destroy();
  });
});
