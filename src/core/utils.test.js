import { describe, it, expect } from 'vitest';
import {
  deepMerge,
  formatNumber,
  formatCompact,
  estimateTextWidth,
  parseColor,
  rgbToHex,
  lightenColor,
  darkenColor,
  getMinMax,
  generateScale,
  lerp,
  clamp,
  isNumber,
  getNestedValue
} from './utils.js';

describe('deepMerge', () => {
  it('merges flat objects', () => {
    expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it('overwrites primitive values', () => {
    expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  it('merges nested objects deeply', () => {
    const target = { style: { color: 'red', font: { size: 12 } } };
    const source = { style: { font: { weight: 'bold' } } };
    const result = deepMerge(target, source);
    expect(result.style.color).toBe('red');
    expect(result.style.font.size).toBe(12);
    expect(result.style.font.weight).toBe('bold');
  });

  it('does not merge arrays — replaces them', () => {
    expect(deepMerge({ a: [1, 2] }, { a: [3] })).toEqual({ a: [3] });
  });

  it('does not merge Date objects — replaces them', () => {
    const d = new Date('2025-01-01');
    expect(deepMerge({ a: new Date('2020-01-01') }, { a: d }).a).toBe(d);
  });

  it('does not mutate the target', () => {
    const target = { a: 1 };
    deepMerge(target, { b: 2 });
    expect(target).toEqual({ a: 1 });
  });

  it('handles null source values', () => {
    expect(deepMerge({ a: 1 }, { a: null })).toEqual({ a: null });
  });
});

describe('formatNumber', () => {
  it('formats integers', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('formats with decimals', () => {
    expect(formatNumber(3.14159, 2)).toBe('3.14');
  });

  it('returns string for non-numbers', () => {
    expect(formatNumber('abc')).toBe('abc');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles negative numbers', () => {
    const result = formatNumber(-1500, 0);
    expect(result).toContain('1,500');
  });

  it('formats large numbers (millions) without losing leading digits', () => {
    const result = formatNumber(1500000, 0);
    expect(result).toMatch(/1[\s,.]?500[\s,.]?000/);
  });

  it('formats with explicit locale', () => {
    const result = formatNumber(1000000, 0, 'en-US');
    expect(result).toBe('1,000,000');
  });

  it('all digits are present for 7-digit numbers', () => {
    const result = formatNumber(2345678, 0);
    // Regardless of locale, all digits must be present
    const digitsOnly = result.replace(/\D/g, '');
    expect(digitsOnly).toBe('2345678');
  });
});

describe('formatCompact', () => {
  describe('auto-decimals (default)', () => {
    it('shows 1 decimal for single-digit millions (2.5M)', () => {
      expect(formatCompact(2500000)).toBe('2.5M');
    });

    it('shows 1 decimal for 1.9M', () => {
      expect(formatCompact(1900000)).toBe('1.9M');
    });

    it('shows 0 decimals for double-digit millions (30M)', () => {
      expect(formatCompact(30000000)).toBe('30M');
    });

    it('shows 0 decimals for 150M', () => {
      expect(formatCompact(150000000)).toBe('150M');
    });

    it('shows 1 decimal for single-digit thousands (2.5k)', () => {
      expect(formatCompact(2500)).toBe('2.5k');
    });

    it('shows 0 decimals for double-digit thousands (50k)', () => {
      expect(formatCompact(50000)).toBe('50k');
    });

    it('shows 0 decimals for 100k', () => {
      expect(formatCompact(100000)).toBe('100k');
    });

    it('shows 1 decimal for single-digit billions (1.2B)', () => {
      expect(formatCompact(1200000000)).toBe('1.2B');
    });

    it('shows 0 decimals for 50B', () => {
      expect(formatCompact(50000000000)).toBe('50B');
    });

    it('shows 1 decimal for single-digit trillions (3.5T)', () => {
      expect(formatCompact(3500000000000)).toBe('3.5T');
    });
  });

  describe('explicit decimals override', () => {
    it('forces 0 decimals when requested', () => {
      expect(formatCompact(2500000, 0)).toBe('3M');
    });

    it('forces 2 decimals when requested', () => {
      expect(formatCompact(2530000, 2)).toBe('2.53M');
    });

    it('forces 2 decimals for thousands', () => {
      expect(formatCompact(1234, 2)).toBe('1.23k');
    });
  });

  describe('edge cases', () => {
    it('handles zero', () => {
      expect(formatCompact(0)).toBe('0');
    });

    it('handles small numbers (no suffix)', () => {
      expect(formatCompact(500)).toBe('500');
    });

    it('handles negative numbers', () => {
      expect(formatCompact(-2500000)).toBe('-2.5M');
    });

    it('handles negative double-digit millions', () => {
      expect(formatCompact(-30000000)).toBe('-30M');
    });

    it('handles exact million boundary', () => {
      expect(formatCompact(1000000)).toBe('1M');
    });

    it('handles exact thousand boundary', () => {
      expect(formatCompact(1000)).toBe('1k');
    });

    it('returns string for non-numbers', () => {
      expect(formatCompact('abc')).toBe('abc');
    });

    it('handles 9.9M (edge of single-digit)', () => {
      expect(formatCompact(9900000)).toBe('9.9M');
    });

    it('handles 10M (boundary to double-digit)', () => {
      expect(formatCompact(10000000)).toBe('10M');
    });
  });

  describe('backward compatibility with decimals=1', () => {
    it('2500000 with decimals=1 gives 2.5M', () => {
      expect(formatCompact(2500000, 1)).toBe('2.5M');
    });

    it('30000000 with decimals=1 gives 30.0M stripped to 30M', () => {
      expect(formatCompact(30000000, 1)).toBe('30M');
    });
  });
});

describe('estimateTextWidth', () => {
  it('returns a positive number for non-empty strings', () => {
    expect(estimateTextWidth('1,000,000', 12)).toBeGreaterThan(0);
  });

  it('returns wider estimate for longer strings', () => {
    const short = estimateTextWidth('100', 12);
    const long = estimateTextWidth('1,000,000', 12);
    expect(long).toBeGreaterThan(short);
  });

  it('scales with font size', () => {
    const small = estimateTextWidth('1000', 10);
    const large = estimateTextWidth('1000', 20);
    expect(large).toBeGreaterThan(small);
  });

  it('accounts for narrow separator characters', () => {
    const withCommas = estimateTextWidth('1,000,000', 12);
    const withoutCommas = estimateTextWidth('1000000', 12);
    // "1,000,000" has 9 chars (7 digits + 2 commas) vs "1000000" has 7 digits
    // More chars = wider, but commas are narrower than digits
    expect(withCommas).toBeGreaterThan(withoutCommas);
    // But the difference should be less than adding 2 full-width digits
    expect(withCommas - withoutCommas).toBeLessThan(2 * 12 * 0.6);
  });
});

describe('parseColor', () => {
  it('parses 6-digit hex color', () => {
    const { r, g, b, a } = parseColor('#ff0000');
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
    expect(a).toBe(1);
  });

  it('parses another hex color', () => {
    const { r, g, b } = parseColor('#00ff00');
    expect(r).toBe(0);
    expect(g).toBe(255);
    expect(b).toBe(0);
  });

  it('parses black', () => {
    const { r, g, b } = parseColor('#000000');
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('parses white', () => {
    const { r, g, b } = parseColor('#ffffff');
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
  });
});

describe('rgbToHex', () => {
  it('converts RGB to hex', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('pads single digit hex values', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('converts mid-range values', () => {
    expect(rgbToHex(128, 64, 32)).toBe('#804020');
  });
});

describe('lightenColor', () => {
  it('lightens a color', () => {
    const result = lightenColor('#800000', 50);
    const { r, g, b } = parseColor(result);
    expect(r).toBeGreaterThan(128);
  });

  it('clamps to 255', () => {
    const result = lightenColor('#ffffff', 100);
    expect(result).toBe('#ffffff');
  });
});

describe('darkenColor', () => {
  it('darkens a color', () => {
    const result = darkenColor('#ff0000', 50);
    const { r } = parseColor(result);
    expect(r).toBeLessThan(255);
    expect(r).toBeGreaterThan(0);
  });

  it('darkens to black at 100%', () => {
    expect(darkenColor('#ff8040', 100)).toBe('#000000');
  });
});

describe('getMinMax', () => {
  it('finds min and max', () => {
    expect(getMinMax([3, 1, 4, 1, 5])).toEqual({ min: 1, max: 5 });
  });

  it('handles single value', () => {
    expect(getMinMax([42])).toEqual({ min: 42, max: 42 });
  });

  it('returns zero for empty array', () => {
    expect(getMinMax([])).toEqual({ min: 0, max: 0 });
  });

  it('returns zero for null/undefined', () => {
    expect(getMinMax(null)).toEqual({ min: 0, max: 0 });
    expect(getMinMax(undefined)).toEqual({ min: 0, max: 0 });
  });

  it('handles negative values', () => {
    expect(getMinMax([-5, -1, -10])).toEqual({ min: -10, max: -1 });
  });
});

describe('generateScale', () => {
  it('generates evenly spaced values', () => {
    const scale = generateScale(0, 100, 5);
    expect(scale).toEqual([0, 25, 50, 75, 100]);
  });

  it('defaults to 5 steps', () => {
    const scale = generateScale(0, 100);
    expect(scale).toHaveLength(5);
  });

  it('handles negative range', () => {
    const scale = generateScale(-100, 0, 3);
    expect(scale).toEqual([-100, -50, 0]);
  });

  it('handles single step (division by zero edge case)', () => {
    const scale = generateScale(0, 100, 1);
    expect(scale).toHaveLength(1);
    expect(scale[0]).toBe(0);
  });
});

describe('lerp', () => {
  it('returns start at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('returns end at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('returns midpoint at t=0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it('extrapolates beyond 0-1', () => {
    expect(lerp(0, 100, 2)).toBe(200);
  });
});

describe('clamp', () => {
  it('clamps below minimum', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it('clamps above maximum', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('returns value when in range', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 100)).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(100, 0, 100)).toBe(100);
  });
});

describe('isNumber', () => {
  it('returns true for numbers', () => {
    expect(isNumber(42)).toBe(true);
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-3.14)).toBe(true);
  });

  it('returns false for NaN', () => {
    expect(isNumber(NaN)).toBe(false);
  });

  it('returns false for non-numbers', () => {
    expect(isNumber('42')).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
    expect(isNumber(true)).toBe(false);
  });
});

describe('getNestedValue', () => {
  const obj = { a: { b: { c: 42 } }, x: [1, 2, 3] };

  it('gets deeply nested value', () => {
    expect(getNestedValue(obj, 'a.b.c')).toBe(42);
  });

  it('returns undefined for missing path', () => {
    expect(getNestedValue(obj, 'a.b.d')).toBeUndefined();
  });

  it('returns default value for missing path', () => {
    expect(getNestedValue(obj, 'a.b.d', 'default')).toBe('default');
  });

  it('gets top-level value', () => {
    expect(getNestedValue(obj, 'x')).toEqual([1, 2, 3]);
  });

  it('handles null in chain', () => {
    expect(getNestedValue({ a: null }, 'a.b')).toBeUndefined();
  });
});
