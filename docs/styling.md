# Styling & Theming

NewChart JS has a three-layer styling system. Each layer overrides the previous:

```
Defaults  <  JS Config  <  CSS Custom Properties
```

This means you can theme charts entirely from CSS without touching JavaScript, or override everything from JS, or use a combination of both.

---

## 1. JS Config (`style.*`)

Pass visual settings in the `style` object when creating a chart:

```js
NewChart.create('#chart', {
  type: 'bar',
  data: { ... },
  style: {
    background: '#1a1a2e',
    fontFamily: "'Roboto', sans-serif",
    fontSize: 13,
    fontColor: '#e0e0e0',
    grid: {
      color: '#333',
      width: 1
    },
    axis: {
      color: '#666',
      width: 1,
      fontSize: 11
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    },
    tooltip: {
      background: '#2a2a3e',
      color: '#ffffff',
      fontSize: 11,
      padding: 10,
      borderRadius: 6,
      shadow: '0 8px 24px rgba(0,0,0,0.35)'
    },
    legend: {
      fontSize: 11,
      color: '#374151',
      marker: { size: 10 }
    },
    bar: {
      borderRadius: 4,
      gap: 0.2,
      groupGap: 0.5
    }
  }
});
```

### Global style properties

| Property | Type | Default | Description |
|---|---|---|---|
| `style.background` | `string` | `'#ffffff'` | Chart background color |
| `style.fontFamily` | `string` | `'Inter', system stack` | Primary font family |
| `style.monoFamily` | `string` | `'JetBrains Mono', system mono` | Monospace font for values |
| `style.fontSize` | `number` | `12` | Base font size (px) |
| `style.fontColor` | `string` | `'#374151'` | Base text color |

### Grid

| Property | Type | Default | Description |
|---|---|---|---|
| `style.grid.color` | `string` | `'#E5E7EB'` | Grid line color |
| `style.grid.width` | `number` | `1` | Grid line width |

### Axis

| Property | Type | Default | Description |
|---|---|---|---|
| `style.axis.color` | `string` | `'#374151'` | Axis line and label color |
| `style.axis.width` | `number` | `1` | Axis line width |
| `style.axis.fontSize` | `number` | `12` | Axis label font size |

### Animation

| Property | Type | Default | Description |
|---|---|---|---|
| `style.animation.duration` | `number` | `600` | Animation duration (ms). Set `0` to disable |
| `style.animation.easing` | `string` | `'easeOutCubic'` | Easing function name |

Available easing functions:

| Name | Description |
|---|---|
| `linear` | Constant speed |
| `easeInQuad` | Accelerating |
| `easeOutQuad` | Decelerating |
| `easeInOutQuad` | Accelerate then decelerate |
| `easeInCubic` | Accelerating (steeper) |
| `easeOutCubic` | Decelerating (steeper) - **default** |
| `easeInOutCubic` | Smooth S-curve |
| `easeInQuart` | Accelerating (steep) |
| `easeOutQuart` | Decelerating (steep) |
| `easeInOutQuart` | Sharp S-curve |
| `easeInQuint` | Accelerating (steepest) |
| `easeOutQuint` | Decelerating (steepest) |
| `easeInOutQuint` | Sharpest S-curve |

Spring physics animation is also available via the `springAnimate()` API for custom use.

### Tooltip

| Property | Type | Default | Description |
|---|---|---|---|
| `style.tooltip.background` | `string` | `'#1F2937'` | Background |
| `style.tooltip.color` | `string` | `'#FFFFFF'` | Text color |
| `style.tooltip.fontSize` | `number` | `12` | Font size |
| `style.tooltip.padding` | `number` | `8` | Inner padding |
| `style.tooltip.borderRadius` | `number` | `4` | Corner radius |
| `style.tooltip.shadow` | `string` | `'0 10px 15px...'` | Box shadow |

### Legend

| Property | Type | Default | Description |
|---|---|---|---|
| `style.legend.fontSize` | `number` | `12` | Label font size |
| `style.legend.color` | `string` | `'#374151'` | Label text color |
| `style.legend.marker.size` | `number` | `8` | Color marker width |

---

## 2. CSS Custom Properties (`--nc-*` tokens)

Theme charts using standard CSS custom properties on the container element. This is the recommended approach for theming because it:

- Works with CSS classes, media queries, and `:root`
- Enables dark mode with zero JS
- Lets designers style charts without touching application code

### Enabling/Disabling

CSS token resolution is **enabled by default**. To disable:

```js
{ options: { cssTokens: false } }
```

### Token Reference

All tokens follow the pattern `--nc-{category}-{property}`:

#### Global

| CSS Token | Maps to | Type |
|---|---|---|
| `--nc-background` | `style.background` | color |
| `--nc-font-family` | `style.fontFamily` | string |
| `--nc-font-size` | `style.fontSize` | number |
| `--nc-font-color` | `style.fontColor` | color |

#### Grid

| CSS Token | Maps to | Type |
|---|---|---|
| `--nc-grid-color` | `style.grid.color` | color |
| `--nc-grid-width` | `style.grid.width` | number |

#### Axis

| CSS Token | Maps to | Type |
|---|---|---|
| `--nc-axis-color` | `style.axis.color` | color |
| `--nc-axis-width` | `style.axis.width` | number |
| `--nc-axis-font-size` | `style.axis.fontSize` | number |

#### Animation

| CSS Token | Maps to | Type |
|---|---|---|
| `--nc-animation-duration` | `style.animation.duration` | number (ms) |

#### Tooltip

| CSS Token | Maps to | Type |
|---|---|---|
| `--nc-tooltip-background` | `style.tooltip.background` | color |
| `--nc-tooltip-color` | `style.tooltip.color` | color |
| `--nc-tooltip-font-size` | `style.tooltip.fontSize` | number |
| `--nc-tooltip-padding` | `style.tooltip.padding` | number |
| `--nc-tooltip-border-radius` | `style.tooltip.borderRadius` | number |
| `--nc-tooltip-shadow` | `style.tooltip.shadow` | string |

#### Legend

| CSS Token | Maps to | Type |
|---|---|---|
| `--nc-legend-font-size` | `style.legend.fontSize` | number |
| `--nc-legend-color` | `style.legend.color` | color |
| `--nc-legend-marker-size` | `style.legend.marker.size` | number |

#### Bar

| CSS Token | Maps to | Type |
|---|---|---|
| `--nc-bar-border-radius` | `style.bar.borderRadius` | number |
| `--nc-bar-gap` | `style.bar.gap` | number |
| `--nc-bar-group-gap` | `style.bar.groupGap` | number |

#### Line

| CSS Token | Maps to | Type |
|---|---|---|
| `--nc-line-width` | `style.line.width` | number |
| `--nc-line-tension` | `style.line.tension` | number |
| `--nc-line-point-radius` | `style.line.pointRadius` | number |
| `--nc-line-point-border-width` | `style.line.pointBorderWidth` | number |
| `--nc-line-point-border-color` | `style.line.pointBorderColor` | color |

#### Pie / Donut

| CSS Token | Maps to | Type |
|---|---|---|
| `--nc-pie-border-width` | `style.pie.borderWidth` | number |
| `--nc-pie-border-color` | `style.pie.borderColor` | color |
| `--nc-pie-inner-radius` | `style.pie.innerRadius` | number |

#### Palette

| CSS Token | Maps to | Type |
|---|---|---|
| `--nc-palette-1` through `--nc-palette-10` | Color palette slots | color |

### Example: Dark Theme

```css
.dark-theme {
  --nc-background: #1a1a2e;
  --nc-font-color: #e0e0e0;
  --nc-grid-color: #2a2a4a;
  --nc-axis-color: #8888aa;
  --nc-tooltip-background: #16162a;
  --nc-tooltip-color: #e0e0e0;
  --nc-tooltip-shadow: 0 8px 24px rgba(0,0,0,0.5);
  --nc-palette-1: #7c3aed;
  --nc-palette-2: #06b6d4;
  --nc-palette-3: #f59e0b;
  --nc-palette-4: #ef4444;
  --nc-palette-5: #10b981;
}
```

```html
<div id="chart" class="dark-theme" style="width: 600px; height: 400px;"></div>
```

### Example: Brand Colors

```css
.brand-theme {
  --nc-palette-1: #0052CC;
  --nc-palette-2: #00B8D9;
  --nc-palette-3: #36B37E;
  --nc-palette-4: #FF5630;
  --nc-palette-5: #6554C0;
  --nc-font-family: 'Company Sans', sans-serif;
}
```

### Example: Dark Mode Toggle

```css
@media (prefers-color-scheme: dark) {
  .chart-container {
    --nc-background: #0d1117;
    --nc-font-color: #c9d1d9;
    --nc-grid-color: #21262d;
    --nc-axis-color: #8b949e;
    --nc-tooltip-background: #161b22;
    --nc-tooltip-color: #c9d1d9;
  }
}
```

### Programmatic Token List

Get all supported token names at runtime:

```js
const tokens = NewChart.getSupportedTokens();
// ['--nc-background', '--nc-font-family', '--nc-font-size', ...]
```

---

## 3. Color Palette

The default palette contains 10 colors:

| Index | Color | Hex | Usage |
|---|---|---|---|
| 0 | Blue | `#4c6ef5` | Primary |
| 1 | Green | `#0ca678` | Success |
| 2 | Orange | `#f08c00` | Warning |
| 3 | Red | `#e03131` | Danger |
| 4 | Purple | `#7048e8` | |
| 5 | Teal | `#1098ad` | |
| 6 | Pink | `#d6336c` | |
| 7 | Light blue | `#5c7cfa` | |
| 8 | Mint | `#20c997` | |
| 9 | Yellow | `#fcc419` | |

The compare/previous-period color is `#b3bac5` (available as `NewChart.COMPARE_COLOR`).

### Override palette

**Per dataset:**
```js
datasets: [{ label: 'A', values: [...], color: '#ff6b6b' }]
```

**Per slice (PieChart):**
```js
datasets: [{ values: [...], colors: ['#ff6b6b', '#51cf66', '#339af0'] }]
```

**Entire palette via JS:**
```js
{ palette: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'] }
```

**Entire palette via CSS:**
```css
.my-chart {
  --nc-palette-1: #264653;
  --nc-palette-2: #2a9d8f;
  --nc-palette-3: #e9c46a;
  --nc-palette-4: #f4a261;
  --nc-palette-5: #e76f51;
}
```

When more datasets exist than palette colors, colors cycle from the beginning.

---

## 4. Typography

NewChart uses two font stacks:

| Property | Default | Used for |
|---|---|---|
| `style.fontFamily` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | Labels, legend, axis text |
| `style.monoFamily` | `'JetBrains Mono', 'SF Mono', 'Fira Code', monospace` | Values in tooltips, data table, gauge center |

Override via JS config:
```js
{
  style: {
    fontFamily: "'Roboto', sans-serif",
    monoFamily: "'Roboto Mono', monospace"
  }
}
```

Or via CSS:
```css
.my-chart { --nc-font-family: 'Roboto', sans-serif; }
```

---

## 5. Responsive Behavior

Charts are responsive by default via `ResizeObserver`:

```js
{
  options: {
    responsive: true,         // Enable resize observer (default: true)
    maintainAspectRatio: true  // Preserve aspect ratio on resize
  }
}
```

The chart container must have a defined width and height (via CSS or inline style). Minimum rendered size is 300x300 px.

---

## 6. Disabling Animations

```js
// Per chart
{ style: { animation: { duration: 0 } } }

// Via CSS
.no-animation { --nc-animation-duration: 0; }

// Respect user preference
@media (prefers-reduced-motion: reduce) {
  .chart-container { --nc-animation-duration: 0; }
}
```

---

## Priority & Merge Order

When multiple sources define the same property, the highest-priority source wins:

```
1. CSS Custom Properties (--nc-*)     ← highest priority
2. JS config passed to create()
3. Chart-type defaults (BAR_DEFAULTS, LINE_DEFAULTS, etc.)
4. Global defaults (DEFAULT_CONFIG)   ← lowest priority
```

Example: if you set `style.background: '#fff'` in JS but also define `--nc-background: #000` in CSS on the container, the chart background will be **black** (CSS wins).

The `update()` method merges with the current config (which already includes CSS overrides). To force a JS value over CSS, either remove the CSS property or disable CSS tokens:

```js
{ options: { cssTokens: false } }
```
