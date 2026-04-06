# NewChart JS Architecture Reference

## Project Stats

- ~2,600 lines of source code across 10 files
- Zero external dependencies
- Outputs: UMD, ESM, CJS via Rollup
- Bundle size: ~26 KB minified

## Class Hierarchy

```
Chart (base)
├── BarChart
├── LineChart
├── PieChart
└── [future chart types]

Standalone Components (composed into Chart):
├── Tooltip
├── Legend
├── SVGRenderer / CanvasRenderer
└── Animation (utility module, not a class)
```

## Lifecycle Flow

```
constructor(element, config, defaults)
  → deepMerge(defaults, config)
  → create container div
  → create renderer (SVG or Canvas based on dataset size)
  → create tooltip (if enabled)
  → create legend (if enabled)
  → attach ResizeObserver
  → start animation → calls render(progress) on each frame
  → animation completes at progress = 1.0
```

## Public API

```javascript
// Factory
const chart = NewChart.create('#container', config);

// Instance methods
chart.update(partialConfig);    // Merge new config, re-animate
chart.destroy();                // Remove DOM, detach listeners
chart.toPNG();                  // Export as PNG data URL (SVG only)
chart.toSVG();                  // Export as SVG string (SVG only)
```

## Data Structure

```javascript
data: {
  labels: ['Jan', 'Feb', 'Mar'],      // X-axis labels
  datasets: [
    {
      label: 'Revenue 2026',           // Legend label
      values: [2850, 3120, 2960],      // Y-axis values
      color: '#4c6ef5',                // Optional, uses palette if omitted
      colors: ['#f00', '#0f0', '#00f'] // Optional, per-bar/slice colors
    },
    {
      label: 'Revenue 2025',
      values: [2200, 2450, 2380],
    }
  ]
}
```

## Renderer API

Both SVGRenderer and CanvasRenderer implement:

```javascript
renderer.rect(x, y, width, height, options)     // options: fill, stroke, rx, opacity, ...
renderer.circle(x, y, radius, options)
renderer.line(x1, y1, x2, y2, options)           // options: stroke, strokeWidth, dasharray
renderer.polyline(points, options)                // points: [{x, y}]
renderer.path(d, options)                         // SVG path data string
renderer.text(content, x, y, options)             // options: fontSize, fontFamily, fill, anchor
renderer.arc(cx, cy, outerR, startAngle, endAngle, options)  // options: innerRadius for donut
renderer.clear()                                  // Remove all elements
renderer.destroy()                                // Remove the renderer element itself
```

## Animation API

```javascript
import Animation from './core/Animation.js';

// Simple value animation
const cancel = Animation.animate({
  duration: 600,
  easing: 'easeOutCubic',
  onUpdate: (progress) => { /* 0→1 */ },
  onComplete: () => { /* done */ }
});

// Multiple synchronized animations
Animation.animateMultiple([
  { from: 0, to: 100, duration: 600, onUpdate: (val) => {} },
  { from: 0, to: 200, duration: 600, delay: 100, onUpdate: (val) => {} },
]);

// Spring physics
Animation.springAnimate({
  from: 0, to: 1,
  stiffness: 180, damping: 12,
  onUpdate: (val) => {}
});
```

### Available Easings
`linear`, `easeInQuad`, `easeOutQuad`, `easeInOutQuad`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic`, `easeInQuart`, `easeOutQuart`, `easeInOutQuart`, `easeInQuint`, `easeOutQuint`, `easeInOutQuint`

## Utility Functions (utils.js)

**Color:** `parseColor(hex)` → {r,g,b}, `lightenColor(hex, amount)`, `darkenColor(hex, amount)`, `rgbToHex(r,g,b)`

**Math:** `lerp(a, b, t)`, `clamp(val, min, max)`, `getMinMax(array)`, `generateScale(min, max, steps)`

**DOM:** `createElement(tag, attrs, ns)`, `getCursorPosition(event, element)`

**Format:** `formatNumber(num, locale)` — uses `Intl.NumberFormat`

**Performance:** `debounce(fn, ms)`, `getPixelRatio()`

**Data:** `getNestedValue(obj, path)` — dot-notation access, `deepMerge(target, source)`

## Config Priority

When configs are merged, specificity wins:
```
DEFAULT_CONFIG (base)
  ← CHART_TYPE_DEFAULTS (e.g., BAR_DEFAULTS)
    ← user config (highest priority)
```

The `deepMerge` utility handles this recursively — nested objects are merged, primitives are overwritten.
