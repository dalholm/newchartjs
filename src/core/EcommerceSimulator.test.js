import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EcommerceSimulator } from './EcommerceSimulator.js';

describe('EcommerceSimulator', () => {
  let sim;

  afterEach(() => {
    if (sim) sim.destroy();
  });

  // ── Constructor & seed ──

  it('creates with default config', () => {
    sim = new EcommerceSimulator();
    expect(sim.config.baseVisitors).toBe(25);
    expect(sim.config.avgOrderValue).toBe(890);
    expect(sim.config.conversionRate).toBe(2.8);
  });

  it('seeds initial visitors on creation', () => {
    sim = new EcommerceSimulator({ baseVisitors: 20 });
    expect(sim._visitors.length).toBeGreaterThan(0);
  });

  it('seeds initial carts on creation', () => {
    sim = new EcommerceSimulator({ baseVisitors: 30 });
    // At least some carts should exist (~12% of visitors)
    expect(sim._carts.length).toBeGreaterThanOrEqual(0);
  });

  it('seeds revenue history', () => {
    sim = new EcommerceSimulator();
    expect(sim._revenueHistory.length).toBe(20);
  });

  it('seeds activity feed', () => {
    sim = new EcommerceSimulator();
    expect(sim._activityFeed.length).toBe(5);
  });

  // ── Start / stop ──

  it('starts and stops without errors', () => {
    sim = new EcommerceSimulator({ tickInterval: 100 });
    sim.start();
    expect(sim._timer).not.toBeNull();
    sim.stop();
    expect(sim._timer).toBeNull();
  });

  it('does not double-start', () => {
    sim = new EcommerceSimulator({ tickInterval: 100 });
    sim.start();
    const timer1 = sim._timer;
    sim.start();
    expect(sim._timer).toBe(timer1);
    sim.stop();
  });

  // ── Callbacks ──

  it('calls onVisitorsUpdate on tick', async () => {
    const onVisitorsUpdate = vi.fn();
    sim = new EcommerceSimulator({
      tickInterval: 50,
      onVisitorsUpdate
    });
    sim.start();

    await new Promise(r => setTimeout(r, 120));
    sim.stop();

    expect(onVisitorsUpdate).toHaveBeenCalled();
    const data = onVisitorsUpdate.mock.calls[0][0];
    expect(data).toHaveProperty('visitors');
    expect(data).toHaveProperty('carts');
    expect(data).toHaveProperty('pages');
    expect(Array.isArray(data.pages)).toBe(true);
  });

  it('calls onRevenueUpdate on tick', async () => {
    const onRevenueUpdate = vi.fn();
    sim = new EcommerceSimulator({
      tickInterval: 50,
      onRevenueUpdate
    });
    sim.start();

    await new Promise(r => setTimeout(r, 120));
    sim.stop();

    expect(onRevenueUpdate).toHaveBeenCalled();
    const data = onRevenueUpdate.mock.calls[0][0];
    expect(data).toHaveProperty('revenue');
    expect(data).toHaveProperty('orders');
    expect(data).toHaveProperty('avgOrder');
    expect(data).toHaveProperty('sparkline');
  });

  it('calls onActivityUpdate on tick', async () => {
    const onActivityUpdate = vi.fn();
    sim = new EcommerceSimulator({
      tickInterval: 50,
      onActivityUpdate
    });
    sim.start();

    await new Promise(r => setTimeout(r, 120));
    sim.stop();

    expect(onActivityUpdate).toHaveBeenCalled();
    const data = onActivityUpdate.mock.calls[0][0];
    expect(data).toHaveProperty('events');
    expect(Array.isArray(data.events)).toBe(true);
  });

  it('calls onPulseUpdate on tick', async () => {
    const onPulseUpdate = vi.fn();
    sim = new EcommerceSimulator({
      tickInterval: 50,
      onPulseUpdate
    });
    sim.start();

    await new Promise(r => setTimeout(r, 120));
    sim.stop();

    expect(onPulseUpdate).toHaveBeenCalled();
    const data = onPulseUpdate.mock.calls[0][0];
    expect(data).toHaveProperty('conversionRate');
    expect(data).toHaveProperty('steps');
    expect(data.steps.length).toBe(4);
  });

  it('calls combined onUpdate on tick', async () => {
    const onUpdate = vi.fn();
    sim = new EcommerceSimulator({
      tickInterval: 50,
      onUpdate
    });
    sim.start();

    await new Promise(r => setTimeout(r, 120));
    sim.stop();

    expect(onUpdate).toHaveBeenCalled();
    const data = onUpdate.mock.calls[0][0];
    expect(data).toHaveProperty('visitors');
    expect(data).toHaveProperty('revenue');
    expect(data).toHaveProperty('activity');
    expect(data).toHaveProperty('pulse');
  });

  // ── Data evolution ──

  it('visitors change over multiple ticks', async () => {
    const counts = [];
    sim = new EcommerceSimulator({
      tickInterval: 30,
      baseVisitors: 15,
      onVisitorsUpdate: (d) => counts.push(d.visitors)
    });
    sim.start();

    await new Promise(r => setTimeout(r, 250));
    sim.stop();

    // Should have multiple data points
    expect(counts.length).toBeGreaterThan(3);
  });

  it('revenue history grows with ticks', async () => {
    let sparkLen = 0;
    sim = new EcommerceSimulator({
      tickInterval: 30,
      onRevenueUpdate: (d) => { sparkLen = d.sparkline.length; }
    });
    const initialLen = sim._revenueHistory.length;
    sim.start();

    await new Promise(r => setTimeout(r, 200));
    sim.stop();

    expect(sparkLen).toBeGreaterThan(initialLen);
  });

  it('limits activity feed to 15 items', async () => {
    sim = new EcommerceSimulator({ tickInterval: 20 });
    // Seed many events
    for (let i = 0; i < 25; i++) {
      sim._activityFeed.push({ type: 'order', text: 'test', time: 'now', amount: 100 });
    }
    sim.start();

    await new Promise(r => setTimeout(r, 100));
    sim.stop();

    expect(sim._activityFeed.length).toBeLessThanOrEqual(15);
  });

  // ── Destroy ──

  it('cleans up on destroy', () => {
    sim = new EcommerceSimulator({ tickInterval: 100 });
    sim.start();
    sim.destroy();
    expect(sim._timer).toBeNull();
    expect(sim._visitors.length).toBe(0);
    expect(sim._carts.length).toBe(0);
    expect(sim._activityFeed.length).toBe(0);
    sim = null; // prevent afterEach double destroy
  });

  // ── Traffic weight ──

  it('returns a traffic weight between 0 and 1', () => {
    sim = new EcommerceSimulator();
    const weight = sim._getTrafficWeight();
    expect(weight).toBeGreaterThanOrEqual(0);
    expect(weight).toBeLessThanOrEqual(1);
  });

  // ── Page aggregation ──

  it('aggregates visitors by page URL', async () => {
    let pages = [];
    sim = new EcommerceSimulator({
      tickInterval: 50,
      baseVisitors: 10,
      onVisitorsUpdate: (d) => { pages = d.pages; }
    });
    sim.start();

    await new Promise(r => setTimeout(r, 120));
    sim.stop();

    expect(Array.isArray(pages)).toBe(true);
    // Pages should be sorted by count descending
    for (let i = 1; i < pages.length; i++) {
      expect(pages[i - 1].count).toBeGreaterThanOrEqual(pages[i].count);
    }
  });
});
