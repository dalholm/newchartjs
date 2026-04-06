import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LiveWidget } from './LiveWidget.js';

describe('LiveWidget', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '500px';
    container.style.height = '400px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function createWidget(config = {}) {
    return new LiveWidget(container, {
      variant: 'visitors',
      data: {
        visitors: 12,
        carts: 3,
        pages: [
          { url: '/sv/products/test-product', count: 4 },
          { url: '/sv/collections/sale', count: 2 }
        ],
        cartItems: [
          { product: 'Test Product', qty: 1, value: 299 }
        ]
      },
      ...config
    });
  }

  // ── Constructor ──

  it('renders visitors variant', () => {
    const w = createWidget();
    expect(container.querySelector('.nc-lw-visitors')).not.toBeNull();
    w.destroy();
  });

  it('renders revenue variant', () => {
    const w = createWidget({
      variant: 'revenue',
      data: { revenue: 45000, orders: 12, avgOrder: 3750, convRate: 2.5, sparkline: [1000, 2000, 3000] }
    });
    expect(container.querySelector('.nc-lw-revenue')).not.toBeNull();
    w.destroy();
  });

  it('renders activity variant', () => {
    const w = createWidget({
      variant: 'activity',
      data: { events: [{ type: 'order', text: 'Test order', time: 'just nu', amount: 500 }] }
    });
    expect(container.querySelector('.nc-lw-activity')).not.toBeNull();
    w.destroy();
  });

  it('renders pulse variant', () => {
    const w = createWidget({
      variant: 'pulse',
      data: {
        conversionRate: 3.2,
        totalVisitors: 100,
        totalOrders: 3,
        steps: [
          { label: 'Besökare', count: 100 },
          { label: 'Produktvisningar', count: 60 },
          { label: 'Varukorg', count: 15 },
          { label: 'Köp', count: 3 }
        ]
      }
    });
    expect(container.querySelector('.nc-lw-pulse')).not.toBeNull();
    w.destroy();
  });

  it('throws if element not found', () => {
    expect(() => new LiveWidget('#nonexistent', {})).toThrow('LiveWidget element not found');
  });

  // ── Visitors variant ──

  it('shows visitor count in hero', () => {
    const w = createWidget();
    const heroValue = container.querySelector('[data-field="visitors"]');
    expect(heroValue.textContent).toContain('12');
    w.destroy();
  });

  it('shows cart count in hero', () => {
    const w = createWidget();
    const heroValue = container.querySelector('[data-field="carts"]');
    expect(heroValue.textContent).toContain('3');
    w.destroy();
  });

  it('renders page list rows', () => {
    const w = createWidget();
    const rows = container.querySelectorAll('.lw-list-row');
    expect(rows.length).toBe(2);
    w.destroy();
  });

  it('switches tabs between pages and carts', () => {
    const w = createWidget();
    const cartTab = container.querySelectorAll('.lw-tab')[1];
    cartTab.click();
    const cartRows = container.querySelectorAll('.lw-cart-row');
    expect(cartRows.length).toBe(1);
    w.destroy();
  });

  // ── Update ──

  it('updates visitor data', () => {
    const w = createWidget();
    w.update({ visitors: 25, carts: 5, pages: [{ url: '/new-page', count: 10 }] });
    // After animation, the count should update (immediately check DOM text)
    const rows = container.querySelectorAll('.lw-list-row');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('/new-page');
    w.destroy();
  });

  it('updates activity feed', () => {
    const w = createWidget({
      variant: 'activity',
      data: { events: [] }
    });
    w.update({
      events: [{ type: 'order', text: '<strong>Anna</strong> beställde', time: 'just nu', amount: 890 }]
    });
    const items = container.querySelectorAll('.lw-act-item');
    expect(items.length).toBe(1);
    w.destroy();
  });

  it('updates pulse funnel steps', () => {
    const w = createWidget({
      variant: 'pulse',
      data: { conversionRate: 0, totalVisitors: 0, totalOrders: 0, steps: [] }
    });
    w.update({
      conversionRate: 2.5,
      totalVisitors: 80,
      totalOrders: 2,
      steps: [
        { label: 'Besökare', count: 80 },
        { label: 'Köp', count: 2 }
      ]
    });
    const steps = container.querySelectorAll('.lw-funnel-step');
    expect(steps.length).toBe(2);
    w.destroy();
  });

  // ── Dark theme ──

  it('applies dark colors when theme is dark', () => {
    const w = createWidget({ theme: 'dark' });
    const el = container.querySelector('.nc-lw-visitors');
    expect(el).not.toBeNull();
    // Check that dark surface color is applied
    expect(el.style.cssText || el.closest('.nc-live-widget')?.innerHTML).toContain('#1a1d23');
    w.destroy();
  });

  // ── Destroy ──

  it('removes DOM on destroy', () => {
    const w = createWidget();
    expect(container.querySelector('.nc-live-widget')).not.toBeNull();
    w.destroy();
    expect(container.querySelector('.nc-live-widget')).toBeNull();
  });

  // ── Edge cases ──

  it('handles empty pages list', () => {
    const w = createWidget({
      data: { visitors: 0, carts: 0, pages: [], cartItems: [] }
    });
    const empty = container.querySelector('.lw-empty');
    expect(empty).not.toBeNull();
    w.destroy();
  });

  it('handles empty activity feed', () => {
    const w = createWidget({
      variant: 'activity',
      data: { events: [] }
    });
    const list = container.querySelector('[data-list="events"]');
    expect(list.textContent).toContain('Väntar på aktivitet');
    w.destroy();
  });

  it('escapes HTML in page URLs', () => {
    const w = createWidget({
      data: {
        visitors: 1, carts: 0,
        pages: [{ url: '<script>alert(1)</script>', count: 1 }],
        cartItems: []
      }
    });
    const row = container.querySelector('.lw-page-url');
    expect(row.textContent).toContain('<script>');
    expect(row.innerHTML).not.toContain('<script>');
    w.destroy();
  });
});
