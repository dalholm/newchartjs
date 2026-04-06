import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KPIComparisonCard, createKPIComparisonCard } from './KPIComparisonCard.js';

describe('KPIComparisonCard', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a card with value', () => {
    const card = new KPIComparisonCard(container, {
      label: 'Revenue',
      value: 38900,
      theme: 'light'
    });
    expect(container.innerHTML).toContain('Revenue');
    expect(container.innerHTML).toContain('38,900');
    card.destroy();
  });

  it('renders change badge when previousValue is provided', () => {
    const card = new KPIComparisonCard(container, {
      label: 'Orders',
      value: 5800,
      previousValue: 5200,
      theme: 'light'
    });
    // Should show percentage change
    expect(container.innerHTML).toContain('%');
    card.destroy();
  });

  it('renders progress bar when target is provided', () => {
    const card = new KPIComparisonCard(container, {
      label: 'Sales',
      value: 75,
      target: 100,
      theme: 'light'
    });
    expect(container.innerHTML).toContain('Progress');
    card.destroy();
  });

  it('renders sparkline SVG when sparklineData is provided', () => {
    const card = new KPIComparisonCard(container, {
      label: 'Trend',
      value: 100,
      sparklineData: [10, 20, 15, 30, 25, 40],
      theme: 'light'
    });
    expect(container.querySelector('svg')).not.toBeNull();
    card.destroy();
  });

  it('renders prefix and suffix', () => {
    const card = new KPIComparisonCard(container, {
      label: 'Rate',
      value: 4.2,
      prefix: '$',
      suffix: '%',
      decimals: 1,
      theme: 'light'
    });
    expect(container.innerHTML).toContain('$');
    expect(container.innerHTML).toContain('%');
    card.destroy();
  });

  it('shows status indicator', () => {
    const card = new KPIComparisonCard(container, {
      label: 'KPI',
      value: 50,
      target: 100,
      theme: 'light'
    });
    // Should show danger status (50 < 85% of 100)
    expect(container.innerHTML).toContain('danger');
    card.destroy();
  });

  it('shows good status when value meets target', () => {
    const card = new KPIComparisonCard(container, {
      label: 'KPI',
      value: 100,
      target: 90,
      theme: 'light'
    });
    expect(container.innerHTML).toContain('good');
    card.destroy();
  });

  it('handles down-good direction', () => {
    const card = new KPIComparisonCard(container, {
      label: 'Return Rate',
      value: 3.0,
      previousValue: 4.0,
      direction: 'down-good',
      theme: 'light'
    });
    // Decrease should show as good (green)
    expect(container.innerHTML).toContain('good');
    card.destroy();
  });

  it('update re-renders with new data', () => {
    const card = new KPIComparisonCard(container, {
      label: 'Revenue',
      value: 100,
      theme: 'light'
    });
    card.update({ value: 200 });
    expect(container.innerHTML).toContain('200');
    card.destroy();
  });

  it('factory function creates card', () => {
    const card = createKPIComparisonCard(container, {
      label: 'Test',
      value: 42,
      theme: 'light'
    });
    expect(card).toBeInstanceOf(KPIComparisonCard);
    expect(container.innerHTML).toContain('42');
    card.destroy();
  });

  it('destroy clears container', () => {
    const card = new KPIComparisonCard(container, {
      label: 'Test',
      value: 1,
      theme: 'light'
    });
    card.destroy();
    expect(container.innerHTML).toBe('');
  });

  it('throws on missing element', () => {
    expect(() => new KPIComparisonCard('#nonexistent', { label: 'X', value: 1 }))
      .toThrow('not found');
  });

  it('handles string selector', () => {
    container.id = 'test-kpi';
    const card = new KPIComparisonCard('#test-kpi', {
      label: 'Via Selector',
      value: 99,
      theme: 'light'
    });
    expect(container.innerHTML).toContain('Via Selector');
    card.destroy();
  });
});
