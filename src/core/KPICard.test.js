import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KPICard } from './KPICard.js';

describe('KPICard', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '250px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function createCard(config = {}) {
    return new KPICard(container, {
      label: 'Omsattning',
      value: 38920000,
      previous: 32410000,
      suffix: ' kr',
      ...config
    });
  }

  it('throws when element not found', () => {
    expect(() => new KPICard('#nonexistent')).toThrow('KPICard element not found');
  });

  it('renders label text', () => {
    const card = createCard();
    const label = container.querySelector('.nc-kpi-label');
    expect(label).not.toBeNull();
    expect(label.textContent).toBe('Omsattning');
    card.destroy();
  });

  it('renders formatted value', () => {
    const card = createCard();
    const value = container.querySelector('.nc-kpi-value');
    expect(value).not.toBeNull();
    expect(value.textContent).toContain('38.9M');
    expect(value.textContent).toContain(' kr');
    card.destroy();
  });

  it('renders change badge with percentage', () => {
    const card = createCard();
    const badge = container.querySelector('.nc-kpi-badge');
    expect(badge).not.toBeNull();
    // 38920000 vs 32410000 ≈ +20.1%
    expect(badge.textContent).toMatch(/20\.\d%/);
    card.destroy();
  });

  it('badge shows up arrow for positive change', () => {
    const card = createCard({ value: 200, previous: 100 });
    const badge = container.querySelector('.nc-kpi-badge');
    expect(badge.innerHTML).toContain('▲');
    card.destroy();
  });

  it('badge shows down arrow for negative change', () => {
    const card = createCard({ value: 80, previous: 100 });
    const badge = container.querySelector('.nc-kpi-badge');
    expect(badge.innerHTML).toContain('▼');
    card.destroy();
  });

  it('renders previous value', () => {
    const card = createCard();
    const prev = container.querySelector('.nc-kpi-previous');
    expect(prev).not.toBeNull();
    expect(prev.textContent).toContain('fg.');
    expect(prev.textContent).toContain('32.4M');
    card.destroy();
  });

  it('does not render badge when previous is null', () => {
    const card = createCard({ previous: null });
    const badge = container.querySelector('.nc-kpi-badge');
    expect(badge).toBeNull();
    card.destroy();
  });

  it('does not render previous when previous is null', () => {
    const card = createCard({ previous: null });
    const prev = container.querySelector('.nc-kpi-previous');
    expect(prev).toBeNull();
    card.destroy();
  });

  describe('status dot', () => {
    it('shows green dot when value >= target', () => {
      const card = createCard({ value: 100, target: 100 });
      const dot = container.querySelector('.nc-kpi-status');
      expect(dot).not.toBeNull();
      expect(dot.style.background).toBe('#0ca678');
      card.destroy();
    });

    it('shows yellow dot when value >= 90% of target', () => {
      const card = createCard({ value: 92, target: 100 });
      const dot = container.querySelector('.nc-kpi-status');
      expect(dot.style.background).toBe('#f08c00');
      card.destroy();
    });

    it('shows red dot when value < 90% of target', () => {
      const card = createCard({ value: 70, target: 100 });
      const dot = container.querySelector('.nc-kpi-status');
      expect(dot.style.background).toBe('#e03131');
      card.destroy();
    });

    it('does not show dot when target is null', () => {
      const card = createCard({ target: null });
      const dot = container.querySelector('.nc-kpi-status');
      expect(dot).toBeNull();
      card.destroy();
    });
  });

  describe('progress bar', () => {
    it('renders progress bar when target is set', () => {
      const card = createCard({ value: 75, target: 100 });
      const progress = container.querySelector('.nc-kpi-progress');
      expect(progress).not.toBeNull();
      const fill = container.querySelector('.nc-kpi-progress-fill');
      expect(fill.style.width).toBe('75%');
      card.destroy();
    });

    it('caps progress at 100%', () => {
      const card = createCard({ value: 120, target: 100 });
      const fill = container.querySelector('.nc-kpi-progress-fill');
      expect(fill.style.width).toBe('100%');
      card.destroy();
    });

    it('does not render progress when target is null', () => {
      const card = createCard({ target: null });
      const progress = container.querySelector('.nc-kpi-progress');
      expect(progress).toBeNull();
      card.destroy();
    });
  });

  describe('sparkline', () => {
    it('creates sparkline container when sparkline config is provided', () => {
      const card = createCard({
        sparkline: { values: [10, 20, 15, 30, 25], color: '#4c6ef5' }
      });
      const sparkContainer = container.querySelector('.nc-kpi-sparkline');
      expect(sparkContainer).not.toBeNull();
      expect(sparkContainer.style.width).toBe('64px');
      expect(sparkContainer.style.height).toBe('22px');
      card.destroy();
    });

    it('does not create sparkline container when sparkline is null', () => {
      const card = createCard({ sparkline: null });
      const sparkContainer = container.querySelector('.nc-kpi-sparkline');
      expect(sparkContainer).toBeNull();
      card.destroy();
    });

    it('accepts custom sparkline dimensions', () => {
      const card = createCard({
        sparkline: { values: [10, 20, 30], color: '#4c6ef5', width: 100, height: 30 }
      });
      const sparkContainer = container.querySelector('.nc-kpi-sparkline');
      expect(sparkContainer.style.width).toBe('100px');
      expect(sparkContainer.style.height).toBe('30px');
      card.destroy();
    });
  });

  describe('active state', () => {
    it('applies active border color when active is true', () => {
      const card = createCard({ active: true });
      expect(container.style.borderColor).toBe('#4c6ef5');
      card.destroy();
    });

    it('applies default border color when active is false', () => {
      const card = createCard({ active: false });
      expect(container.style.borderColor).toBe('#dfe1e6');
      card.destroy();
    });

    it('setActive toggles active state', () => {
      const card = createCard({ active: false });
      card.setActive(true);
      expect(container.style.borderColor).toBe('#4c6ef5');
      card.setActive(false);
      expect(container.style.borderColor).toBe('#dfe1e6');
      card.destroy();
    });
  });

  describe('click handler', () => {
    it('calls onClick when card is clicked', () => {
      const spy = vi.fn();
      const card = createCard({ onClick: spy });
      container.click();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        element: container,
        event: expect.any(MouseEvent)
      }));
      card.destroy();
    });

    it('sets cursor to pointer when onClick is set', () => {
      const card = createCard({ onClick: () => {} });
      expect(container.style.cursor).toBe('pointer');
      card.destroy();
    });

    it('sets cursor to default when onClick is not set', () => {
      const card = createCard({ onClick: null });
      expect(container.style.cursor).toBe('default');
      card.destroy();
    });
  });

  describe('custom formatting', () => {
    it('uses custom formatValue function', () => {
      const card = createCard({
        value: 42.5,
        formatValue: (v) => v.toFixed(1) + ' MSEK'
      });
      const value = container.querySelector('.nc-kpi-value');
      expect(value.textContent).toBe('42.5 MSEK');
      card.destroy();
    });

    it('uses prefix and suffix', () => {
      const card = createCard({
        value: 95,
        prefix: '',
        suffix: '%',
        previous: null
      });
      const value = container.querySelector('.nc-kpi-value');
      expect(value.textContent).toBe('95%');
      card.destroy();
    });
  });

  describe('update', () => {
    it('re-renders with new value', () => {
      const card = createCard({ value: 100, previous: null, suffix: '' });
      card.update({ value: 200 });
      const value = container.querySelector('.nc-kpi-value');
      expect(value.textContent).toBe('200');
      card.destroy();
    });

    it('merges partial config', () => {
      const card = createCard();
      card.update({ label: 'Ordrar' });
      const label = container.querySelector('.nc-kpi-label');
      expect(label.textContent).toBe('Ordrar');
      // Value should still be there
      const value = container.querySelector('.nc-kpi-value');
      expect(value).not.toBeNull();
      card.destroy();
    });
  });

  describe('destroy', () => {
    it('clears inner HTML', () => {
      const card = createCard();
      card.destroy();
      expect(container.innerHTML).toBe('');
    });

    it('removes click handler', () => {
      const spy = vi.fn();
      const card = createCard({ onClick: spy });
      card.destroy();
      container.click();
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  describe('value formatting edge cases', () => {
    it('formats thousands correctly', () => {
      const card = createCard({ value: 5872, previous: null, suffix: '' });
      const value = container.querySelector('.nc-kpi-value');
      expect(value.textContent).toBe('5.9k');
      card.destroy();
    });

    it('formats large thousands correctly', () => {
      const card = createCard({ value: 38900, previous: null, suffix: '' });
      const value = container.querySelector('.nc-kpi-value');
      expect(value.textContent).toBe('39k');
      card.destroy();
    });

    it('formats millions correctly', () => {
      const card = createCard({ value: 2500000, previous: null, suffix: '' });
      const value = container.querySelector('.nc-kpi-value');
      expect(value.textContent).toBe('2.5M');
      card.destroy();
    });

    it('formats small numbers without abbreviation', () => {
      const card = createCard({ value: 47, previous: null, suffix: '%', decimals: 1 });
      const value = container.querySelector('.nc-kpi-value');
      expect(value.textContent).toBe('47.0%');
      card.destroy();
    });
  });
});
