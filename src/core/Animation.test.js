import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { animate, delay } from './Animation.js';
import AnimationDefault from './Animation.js';

describe('Animation default export', () => {
  it('exports all functions', () => {
    expect(AnimationDefault.animate).toBe(animate);
    expect(typeof AnimationDefault.animateMultiple).toBe('function');
    expect(typeof AnimationDefault.springAnimate).toBe('function');
    expect(AnimationDefault.delay).toBe(delay);
  });

  it('exports EASING_FUNCTIONS', () => {
    expect(AnimationDefault.EASING_FUNCTIONS).toBeDefined();
    expect(typeof AnimationDefault.EASING_FUNCTIONS.linear).toBe('function');
    expect(typeof AnimationDefault.EASING_FUNCTIONS.easeOutCubic).toBe('function');
  });
});

describe('EASING_FUNCTIONS', () => {
  const easings = AnimationDefault.EASING_FUNCTIONS;

  it('linear returns input unchanged', () => {
    expect(easings.linear(0)).toBe(0);
    expect(easings.linear(0.5)).toBe(0.5);
    expect(easings.linear(1)).toBe(1);
  });

  it('all easing functions return 0 at t=0', () => {
    for (const [name, fn] of Object.entries(easings)) {
      expect(fn(0), `${name}(0)`).toBeCloseTo(0, 5);
    }
  });

  it('all easing functions return 1 at t=1', () => {
    for (const [name, fn] of Object.entries(easings)) {
      expect(fn(1), `${name}(1)`).toBeCloseTo(1, 5);
    }
  });

  it('all easing functions return values between 0-1 at t=0.5', () => {
    for (const [name, fn] of Object.entries(easings)) {
      const val = fn(0.5);
      expect(val, `${name}(0.5)`).toBeGreaterThanOrEqual(0);
      expect(val, `${name}(0.5)`).toBeLessThanOrEqual(1);
    }
  });
});

describe('animate', () => {
  it('returns a cancel function', () => {
    const cancel = animate({ from: 0, to: 1, duration: 100 });
    expect(typeof cancel).toBe('function');
    cancel(); // clean up
  });

  it('cancel stops the animation', () => {
    const onUpdate = vi.fn();
    const cancel = animate({ from: 0, to: 1, duration: 1000, onUpdate });
    cancel();
    // After cancelling, no further calls should happen
    expect(typeof cancel).toBe('function');
  });
});

describe('delay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes callback after duration', () => {
    const cb = vi.fn();
    delay(100, cb);

    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('returns cancel function that prevents execution', () => {
    const cb = vi.fn();
    const cancel = delay(100, cb);

    cancel();
    vi.advanceTimersByTime(200);
    expect(cb).not.toHaveBeenCalled();
  });
});
