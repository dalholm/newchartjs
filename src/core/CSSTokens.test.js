import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveCSSTokens, getSupportedTokens } from './CSSTokens.js';

describe('CSSTokens', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  describe('resolveCSSTokens', () => {
    it('should return empty object when no tokens are set', () => {
      const result = resolveCSSTokens(element);
      expect(result).toEqual({});
    });

    it('should return empty object for null element', () => {
      const result = resolveCSSTokens(null);
      expect(result).toEqual({});
    });

    it('should resolve string tokens', () => {
      element.style.setProperty('--nc-background', '#1a1a2e');
      const result = resolveCSSTokens(element);
      expect(result.style.background).toBe('#1a1a2e');
    });

    it('should resolve number tokens', () => {
      element.style.setProperty('--nc-font-size', '16');
      const result = resolveCSSTokens(element);
      expect(result.style.fontSize).toBe(16);
    });

    it('should resolve nested tokens', () => {
      element.style.setProperty('--nc-grid-color', '#333');
      element.style.setProperty('--nc-grid-width', '2');
      const result = resolveCSSTokens(element);
      expect(result.style.grid.color).toBe('#333');
      expect(result.style.grid.width).toBe(2);
    });

    it('should resolve tooltip tokens', () => {
      element.style.setProperty('--nc-tooltip-background', '#000');
      element.style.setProperty('--nc-tooltip-padding', '12');
      const result = resolveCSSTokens(element);
      expect(result.style.tooltip.background).toBe('#000');
      expect(result.style.tooltip.padding).toBe(12);
    });

    it('should resolve legend tokens', () => {
      element.style.setProperty('--nc-legend-color', '#555');
      element.style.setProperty('--nc-legend-marker-size', '10');
      const result = resolveCSSTokens(element);
      expect(result.style.legend.color).toBe('#555');
      expect(result.style.legend.marker.size).toBe(10);
    });

    it('should resolve bar tokens', () => {
      element.style.setProperty('--nc-bar-border-radius', '8');
      const result = resolveCSSTokens(element);
      expect(result.style.bar.borderRadius).toBe(8);
    });

    it('should resolve line tokens', () => {
      element.style.setProperty('--nc-line-width', '3');
      element.style.setProperty('--nc-line-tension', '0.5');
      const result = resolveCSSTokens(element);
      expect(result.style.line.width).toBe(3);
      expect(result.style.line.tension).toBe(0.5);
    });

    it('should resolve pie tokens', () => {
      element.style.setProperty('--nc-pie-border-width', '3');
      element.style.setProperty('--nc-pie-border-color', '#fff');
      const result = resolveCSSTokens(element);
      expect(result.style.pie.borderWidth).toBe(3);
      expect(result.style.pie.borderColor).toBe('#fff');
    });

    it('should resolve palette tokens', () => {
      element.style.setProperty('--nc-palette-1', '#e94560');
      element.style.setProperty('--nc-palette-2', '#0f3460');
      const result = resolveCSSTokens(element);
      expect(result.palette).toEqual(['#e94560', '#0f3460']);
    });

    it('should ignore invalid number tokens', () => {
      element.style.setProperty('--nc-font-size', 'abc');
      const result = resolveCSSTokens(element);
      expect(result.style).toBeUndefined();
    });

    it('should resolve multiple tokens at once', () => {
      element.style.setProperty('--nc-background', '#222');
      element.style.setProperty('--nc-font-color', '#eee');
      element.style.setProperty('--nc-font-size', '14');
      element.style.setProperty('--nc-grid-color', '#444');
      const result = resolveCSSTokens(element);
      expect(result.style.background).toBe('#222');
      expect(result.style.fontColor).toBe('#eee');
      expect(result.style.fontSize).toBe(14);
      expect(result.style.grid.color).toBe('#444');
    });

    it('should resolve animation duration token', () => {
      element.style.setProperty('--nc-animation-duration', '1000');
      const result = resolveCSSTokens(element);
      expect(result.style.animation.duration).toBe(1000);
    });
  });

  describe('getSupportedTokens', () => {
    it('should return an array of token names', () => {
      const tokens = getSupportedTokens();
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should include core tokens', () => {
      const tokens = getSupportedTokens();
      expect(tokens).toContain('--nc-background');
      expect(tokens).toContain('--nc-font-family');
      expect(tokens).toContain('--nc-grid-color');
    });

    it('should include palette tokens', () => {
      const tokens = getSupportedTokens();
      expect(tokens).toContain('--nc-palette-1');
      expect(tokens).toContain('--nc-palette-10');
    });

    it('should have all tokens prefixed with --nc-', () => {
      const tokens = getSupportedTokens();
      tokens.forEach(token => {
        expect(token.startsWith('--nc-')).toBe(true);
      });
    });
  });
});
