import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CONFIG,
  BAR_DEFAULTS,
  PIE_DEFAULTS,
  LINE_DEFAULTS,
  COLOR_PALETTE,
  getPaletteColor,
  getColors
} from './defaults.js';

describe('DEFAULT_CONFIG', () => {
  it('has required top-level keys', () => {
    expect(DEFAULT_CONFIG).toHaveProperty('type');
    expect(DEFAULT_CONFIG).toHaveProperty('data');
    expect(DEFAULT_CONFIG).toHaveProperty('style');
    expect(DEFAULT_CONFIG).toHaveProperty('options');
  });

  it('defaults to bar type', () => {
    expect(DEFAULT_CONFIG.type).toBe('bar');
  });

  it('has animation config', () => {
    expect(DEFAULT_CONFIG.style.animation.duration).toBe(600);
    expect(DEFAULT_CONFIG.style.animation.easing).toBe('easeOutCubic');
  });

  it('has tooltip config', () => {
    expect(DEFAULT_CONFIG.style.tooltip).toBeDefined();
    expect(DEFAULT_CONFIG.style.tooltip.background).toBe('#1F2937');
  });

  it('defaults to responsive', () => {
    expect(DEFAULT_CONFIG.options.responsive).toBe(true);
  });

  it('defaults to auto renderer', () => {
    expect(DEFAULT_CONFIG.options.renderer).toBe('auto');
  });
});

describe('BAR_DEFAULTS', () => {
  it('has bar type', () => {
    expect(BAR_DEFAULTS.type).toBe('bar');
  });

  it('has bar styling', () => {
    expect(BAR_DEFAULTS.style.bar).toBeDefined();
    expect(BAR_DEFAULTS.style.bar.borderRadius).toBe(4);
    expect(BAR_DEFAULTS.style.bar.gap).toBe(0.2);
  });

  it('defaults to vertical orientation', () => {
    expect(BAR_DEFAULTS.options.orientation).toBe('vertical');
  });

  it('defaults to non-stacked', () => {
    expect(BAR_DEFAULTS.options.stacked).toBe(false);
  });
});

describe('PIE_DEFAULTS', () => {
  it('has pie type', () => {
    expect(PIE_DEFAULTS.type).toBe('pie');
  });

  it('has pie styling', () => {
    expect(PIE_DEFAULTS.style.pie).toBeDefined();
    expect(PIE_DEFAULTS.style.pie.innerRadius).toBe(0);
    expect(PIE_DEFAULTS.style.pie.borderWidth).toBe(2);
  });

  it('defaults legend to right', () => {
    expect(PIE_DEFAULTS.options.legend.position).toBe('right');
  });

  it('defaults labels to percent format', () => {
    expect(PIE_DEFAULTS.options.labels.format).toBe('percent');
  });
});

describe('LINE_DEFAULTS', () => {
  it('has line type', () => {
    expect(LINE_DEFAULTS.type).toBe('line');
  });

  it('has line styling', () => {
    expect(LINE_DEFAULTS.style.line).toBeDefined();
    expect(LINE_DEFAULTS.style.line.width).toBe(2);
    expect(LINE_DEFAULTS.style.line.tension).toBe(0.4);
  });

  it('defaults to smooth lines', () => {
    expect(LINE_DEFAULTS.options.smooth).toBe(true);
  });

  it('defaults to no fill', () => {
    expect(LINE_DEFAULTS.options.fill).toBe(false);
  });

  it('defaults to show points', () => {
    expect(LINE_DEFAULTS.options.showPoints).toBe(true);
  });
});

describe('COLOR_PALETTE', () => {
  it('has 10 colors', () => {
    expect(COLOR_PALETTE).toHaveLength(10);
  });

  it('contains valid hex colors', () => {
    COLOR_PALETTE.forEach(color => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

describe('getPaletteColor', () => {
  it('returns first color at index 0', () => {
    expect(getPaletteColor(0)).toBe(COLOR_PALETTE[0]);
  });

  it('wraps around past palette length', () => {
    expect(getPaletteColor(10)).toBe(COLOR_PALETTE[0]);
    expect(getPaletteColor(11)).toBe(COLOR_PALETTE[1]);
  });
});

describe('getColors', () => {
  it('returns requested number of colors', () => {
    expect(getColors(3)).toHaveLength(3);
  });

  it('wraps around when requesting more than palette size', () => {
    const colors = getColors(12);
    expect(colors).toHaveLength(12);
    expect(colors[10]).toBe(colors[0]);
  });

  it('returns empty array for count 0', () => {
    expect(getColors(0)).toEqual([]);
  });
});
