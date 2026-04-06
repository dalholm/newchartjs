import { describe, it, expect, vi } from 'vitest';
import { DrillDownManager } from './DrillDownManager.js';

function makeData(children) {
  return {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{ label: 'Revenue', values: [100, 200, 150, 180] }],
    children: children || undefined
  };
}

const childQ1 = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{ label: 'Revenue', values: [30, 40, 30] }]
};

const childQ2 = {
  labels: ['Apr', 'May', 'Jun'],
  datasets: [{ label: 'Revenue', values: [60, 70, 70] }],
  children: {
    Apr: {
      labels: ['W1', 'W2', 'W3', 'W4'],
      datasets: [{ label: 'Revenue', values: [12, 16, 18, 14] }]
    }
  }
};

describe('DrillDownManager', () => {
  it('initializes with root data at level 0', () => {
    const mgr = new DrillDownManager({ data: makeData() });
    expect(mgr.currentLevel).toBe(0);
    expect(mgr.currentData.labels).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
    expect(mgr.path).toEqual(['Root']);
  });

  it('drillDown with children map pushes to next level', async () => {
    const mgr = new DrillDownManager({ data: makeData({ Q1: childQ1, Q2: childQ2 }) });
    const result = await mgr.drillDown('Q1');
    expect(mgr.currentLevel).toBe(1);
    expect(result.labels).toEqual(['Jan', 'Feb', 'Mar']);
    expect(mgr.currentData).toBe(result);
    expect(mgr.path).toEqual(['Root', 'Q1']);
  });

  it('drillDown with async callback resolves and pushes', async () => {
    const onDrillDown = vi.fn().mockResolvedValue(childQ1);
    const mgr = new DrillDownManager({ data: makeData(), onDrillDown });

    const result = await mgr.drillDown('Q1');
    expect(result.labels).toEqual(['Jan', 'Feb', 'Mar']);
    expect(mgr.currentLevel).toBe(1);
    expect(onDrillDown).toHaveBeenCalledWith({
      label: 'Q1',
      level: 1,
      path: ['Root', 'Q1']
    });
  });

  it('drillDown throws when no data source exists', async () => {
    const mgr = new DrillDownManager({ data: makeData() });
    await expect(mgr.drillDown('Q1')).rejects.toThrow('No drill-down data available');
  });

  it('navigateTo pops stack to correct level', async () => {
    const mgr = new DrillDownManager({ data: makeData({ Q2: childQ2 }) });
    await mgr.drillDown('Q2');
    await mgr.drillDown('Apr');
    expect(mgr.currentLevel).toBe(2);

    mgr.navigateTo(1);
    expect(mgr.currentLevel).toBe(1);
    expect(mgr.currentData.labels).toEqual(['Apr', 'May', 'Jun']);
  });

  it('navigateTo(0) returns to root', async () => {
    const mgr = new DrillDownManager({ data: makeData({ Q1: childQ1 }) });
    await mgr.drillDown('Q1');
    mgr.navigateTo(0);
    expect(mgr.currentLevel).toBe(0);
    expect(mgr.currentData.labels).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
  });

  it('path returns full label trail', async () => {
    const mgr = new DrillDownManager({ data: makeData({ Q2: childQ2 }), rootLabel: 'Revenue' });
    await mgr.drillDown('Q2');
    await mgr.drillDown('Apr');
    expect(mgr.path).toEqual(['Revenue', 'Q2', 'Apr']);
  });

  it('breadcrumbItems returns correct structure', async () => {
    const mgr = new DrillDownManager({ data: makeData({ Q1: childQ1 }) });
    await mgr.drillDown('Q1');
    expect(mgr.breadcrumbItems).toEqual([
      { label: 'Root', level: 0 },
      { label: 'Q1', level: 1 }
    ]);
  });

  it('canDrillDown returns false for leaf nodes', () => {
    const mgr = new DrillDownManager({ data: makeData() });
    expect(mgr.canDrillDown('Q1')).toBe(false);
  });

  it('canDrillDown returns true when children exist', () => {
    const mgr = new DrillDownManager({ data: makeData({ Q1: childQ1 }) });
    expect(mgr.canDrillDown('Q1')).toBe(true);
    expect(mgr.canDrillDown('Q3')).toBe(false);
  });

  it('canDrillDown returns true with callback even without children', () => {
    const mgr = new DrillDownManager({ data: makeData(), onDrillDown: () => {} });
    expect(mgr.canDrillDown('anything')).toBe(true);
  });

  it('isLoading is true during async resolution', async () => {
    let resolveFn;
    const onDrillDown = () => new Promise(r => { resolveFn = r; });
    const mgr = new DrillDownManager({ data: makeData(), onDrillDown });

    expect(mgr.isLoading).toBe(false);
    const promise = mgr.drillDown('Q1');
    expect(mgr.isLoading).toBe(true);

    resolveFn(childQ1);
    await promise;
    expect(mgr.isLoading).toBe(false);
  });

  it('reset clears to root', async () => {
    const mgr = new DrillDownManager({ data: makeData({ Q1: childQ1 }) });
    await mgr.drillDown('Q1');
    mgr.reset();
    expect(mgr.currentLevel).toBe(0);
  });

  it('handles async callback rejection without changing stack', async () => {
    const onDrillDown = vi.fn().mockRejectedValue(new Error('Network error'));
    const mgr = new DrillDownManager({ data: makeData(), onDrillDown });

    await expect(mgr.drillDown('Q1')).rejects.toThrow('Network error');
    expect(mgr.currentLevel).toBe(0);
  });

  it('handles empty children object', () => {
    const mgr = new DrillDownManager({ data: makeData({}) });
    expect(mgr.canDrillDown('Q1')).toBe(false);
  });

  it('canGoBack is false at root, true after drilling', async () => {
    const mgr = new DrillDownManager({ data: makeData({ Q1: childQ1 }) });
    expect(mgr.canGoBack()).toBe(false);
    await mgr.drillDown('Q1');
    expect(mgr.canGoBack()).toBe(true);
  });

  it('prefers children over callback when both exist', async () => {
    const onDrillDown = vi.fn().mockResolvedValue({ labels: ['X'], datasets: [] });
    const mgr = new DrillDownManager({
      data: makeData({ Q1: childQ1 }),
      onDrillDown
    });

    const result = await mgr.drillDown('Q1');
    expect(result).toBe(childQ1);
    expect(onDrillDown).not.toHaveBeenCalled();
  });
});
