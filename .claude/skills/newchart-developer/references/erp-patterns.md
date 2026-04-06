# ERP-Grade Chart Patterns — Implementation Specification

This document defines how to implement enterprise-grade chart features in NewChart JS, based on analysis of SAP Fiori, Microsoft Dynamics 365, Oracle NetSuite, and Odoo.

## Table of Contents

1. [Chart Toolbar](#chart-toolbar)
2. [Interactive Legend](#interactive-legend)
3. [Table View](#table-view)
4. [Reference Lines](#reference-lines)
5. [Drill-Down with Breadcrumbs](#drill-down)
6. [Semantic Colors](#semantic-colors)
7. [Sparklines](#sparklines)
8. [Annotations](#annotations)
9. [Design Tokens](#design-tokens)

---

## Chart Toolbar

The toolbar sits above the chart and provides standardized actions. SAP Fiori recommends no more than 3 visualization types and advises against overloading the toolbar.

### Config

```javascript
options: {
  toolbar: {
    enabled: true,
    position: 'top',          // 'top' only for now
    actions: {
      chartSwitch: true,       // Toggle between chart types (bar ↔ line)
      viewMode: true,          // Chart / Table / Split view
      export: ['csv', 'png'],  // Available export formats
      fullscreen: false,       // Fullscreen toggle
    },
    // Custom actions can be added:
    custom: [
      { icon: 'filter', label: 'Filter', onClick: (chart) => {} }
    ]
  }
}
```

### Implementation

Create `src/core/Toolbar.js` as a standalone component, composed into Chart the same way Tooltip and Legend are.

**DOM structure:**
```
div.newchart-toolbar
  div.newchart-toolbar-left     (title, breadcrumbs)
  div.newchart-toolbar-right    (chart switch, view mode, export)
```

**Chart type switcher:** A segmented control with icons (bar icon, line icon). When switched, the chart destroys and recreates with the new type, preserving data and config. Internally this means the toolbar calls `chart.switchType('line')` which the base Chart class handles.

**View mode (Chart/Table/Split):** Three-option segmented control. The base Chart class manages a `_viewMode` state:
- `'chart'` — only render the SVG/Canvas
- `'table'` — only render a data table (new `TableView` component)
- `'split'` — render both, chart on top, table below

**Export:** Dropdown or button group. CSV export iterates `data.labels` and `data.datasets` to build a semicolon-separated string (semicolon for Nordic locale compatibility). PNG uses `toPNG()` from the Chart base class. SVG uses `toSVG()`.

### Styling

The toolbar should use the chart's `style.fontFamily` and `style.fontColor`. Background: transparent or very subtle (`#f8f9fb`). Border-bottom: 1px solid grid color. Height: 40px. Button padding: 5px 12px. Font size: 12px.

---

## Interactive Legend

The legend already exists in `src/core/Legend.js` but needs to be upgraded from display-only to interactive filtering.

### Behavior

- **Click** a legend item → toggle that series' visibility. The item dims (opacity 0.4) and the chart re-renders without that series' data. Data stays in memory — only rendering is affected.
- **Hover** a legend item → highlight that series in the chart (full opacity), dim all others (opacity 0.3).
- **Reference series** (budget, average, targets) get a dashed line marker instead of a solid block.

### Config

```javascript
options: {
  legend: {
    enabled: true,
    position: 'top',
    interactive: true,         // NEW: enable click-to-toggle
    items: [                   // NEW: override auto-generated items
      { key: 'budget', label: 'Budget', color: '#f08c00', style: 'dashed' }
    ]
  }
}
```

### Implementation

Extend the existing `Legend.js`:
- Track `_visibleSeries` as a Set in the Chart base class
- On legend click, toggle the series key in the Set and call `chart.draw()`
- Each chart's `render()` method checks `_visibleSeries.has(datasetIndex)` before drawing
- On legend hover, set `chart._highlightedSeries` and trigger a lightweight re-render (just opacity changes, no full re-render)

---

## Table View

Every chart should be viewable as a data table. This is important for accessibility (SAP Fiori mandates it for color-blind users) and for users who want to see exact numbers.

### Config

```javascript
options: {
  table: {
    enabled: true,              // Makes table view available
    columns: 'auto',            // Auto-generate from data, or provide custom
    formatting: {
      numbers: 'sv-SE',         // Locale for number formatting
      prefix: '',               // e.g., '' for currency
      suffix: ' kr',            // e.g., ' kr' for SEK
    },
    striped: true,              // Alternating row colors
    hoverable: true,            // Highlight row on hover
    syncHover: true,            // Sync hover with chart
  }
}
```

### Implementation

Create `src/core/TableView.js`. It generates a `<table>` element below the chart container.

**Columns:** Auto-generated from `data.labels` (first column) and `data.datasets[].label` (subsequent columns). Custom columns can override this.

**Hover sync:** When the user hovers row N in the table, fire the same highlight event as hovering data point N in the chart (and vice versa). This means the Chart base class needs a `_hoveredIndex` state that both the renderer and the table observe.

**Styling:** Use a clean, dense design. Row height: 32px. Font: 12px mono for numbers, sans for labels. Header: uppercase, 10px, muted color, sticky. Alternating row backgrounds. Active row: primary color at 0.04 opacity.

---

## Reference Lines

Horizontal or vertical lines showing targets, budgets, averages, or thresholds.

### Config

```javascript
options: {
  referenceLines: [
    {
      value: 3200,              // Y-axis value (or X-axis for vertical)
      axis: 'y',                // 'x' or 'y'
      label: 'Budget',
      color: '#f08c00',
      lineStyle: 'dashed',      // 'solid', 'dashed', 'dotted'
      lineWidth: 1.5,
      labelPosition: 'end',     // 'start', 'end', 'center'
      showLabel: true,
    },
    {
      value: 'average',         // Special keyword: auto-calculate
      axis: 'y',
      label: 'Genomsnitt',
      color: '#868e96',
      lineStyle: 'dashed',
    }
  ]
}
```

### Implementation

Reference lines render after the main data but before hover overlays, so they appear behind interactive elements. Add a `_renderReferenceLines()` method to the Chart base class that iterates `options.referenceLines` and draws using the renderer.

**Special values:**
- `'average'` — calculate mean of all visible data points
- `'median'` — calculate median
- `'min'` / `'max'` — auto-detect

**Label rendering:** A small pill/badge at the end of the line. Background matches the line color at low opacity. Text is the line color at full opacity. Font: 9px mono.

**Per-bar budget markers:** For bar charts, if a reference line has `perBar: true` and `values: [...]`, render a short horizontal dash on each bar group at the corresponding value. This is how SAP shows budget vs actual per period.

---

## Drill-Down

Click a data point to zoom into more granular data. A breadcrumb trail shows where you are in the hierarchy.

### Config

```javascript
options: {
  drillDown: {
    enabled: true,
    levels: [
      { label: 'Månad', dataKey: 'monthly' },
      { label: 'Vecka', dataKey: 'weekly' },
      { label: 'Dag', dataKey: 'daily' },
    ],
    onDrill: (level, item, chart) => {
      // User provides data for the next level
      // Return a Promise<data> or data directly
      return fetchWeeklyData(item.label);
    }
  }
}
```

### Implementation

**Breadcrumb component:** Create `src/core/Breadcrumb.js`. Renders inside the toolbar (left side). Shows: Home icon → Level 1 label → Level 2 label. Each segment is clickable to navigate back.

**Drill mechanics:** The Chart base class manages a `_drillStack` array. Each entry stores `{ level, label, data, config }`. On drill-down, push the current state. On breadcrumb click, pop back to that level and restore.

**Interaction:** Double-click (not single click, to avoid conflicts with tooltip) triggers drill-down. The chart calls `options.drillDown.onDrill()` which returns new data. The chart animates a transition (e.g., bars shrink and new ones grow in) and updates breadcrumbs.

**Animation:** Use a crossfade: current chart fades out (opacity 0.3 over 200ms) while new data fades in. Or: bars slide left as new bars slide in from the right.

---

## Semantic Colors

Values are colored based on their relationship to a target, not just by dataset. Green = good, yellow = warning, red = critical.

### Config

```javascript
options: {
  semanticColors: {
    enabled: true,
    target: 'budget',          // Reference line key, or a number
    thresholds: {
      good: 1.0,               // >= 100% of target = green
      warning: 0.9,            // >= 90% = yellow
      critical: 0,             // < 90% = red
    },
    colors: {
      good: '#0ca678',
      warning: '#f08c00',
      critical: '#e03131',
    },
    // Apply to: 'bars', 'points', 'labels', 'status-dots'
    applyTo: ['status-dots'],
  }
}
```

### Implementation

Add `_getSemanticColor(value, target)` to Chart base class. Returns the appropriate color based on thresholds. Chart implementations call this when rendering if `semanticColors.enabled`.

**Status dots:** Small circles (r=4) rendered above bars or next to data points. Color indicates performance vs. target.

**Bar coloring:** Option to color the entire bar based on performance (instead of dataset color). Useful for single-dataset charts.

---

## Sparklines

Tiny charts (typically 60-80px wide, 20-30px tall) embedded in KPI cards, table cells, or dashboard headers.

### Config

```javascript
NewChart.sparkline(element, {
  data: [42, 78, 55, 91, 64, 83],
  type: 'line',              // 'line', 'bar', 'area'
  color: '#4c6ef5',
  width: 80,
  height: 24,
  showEndDot: true,          // Dot on last data point
  areaOpacity: 0.08,         // Fill under line
  animate: false,            // Usually false for sparklines
});
```

### Implementation

Create `src/charts/Sparkline.js`. This is NOT a full Chart subclass — it's a lightweight renderer that creates a simple SVG directly. No tooltip, no legend, no axis, no labels. Just the line/bars and optionally an end-dot.

Register as `NewChart.sparkline()` (factory method) and `NewChart.Sparkline` (class).

---

## Annotations

Labels or markers on specific data points to call out events, milestones, or anomalies.

### Config

```javascript
options: {
  annotations: [
    {
      dataIndex: 4,            // Which data point
      label: 'Kampanj start',
      position: 'top',         // 'top', 'bottom', 'left', 'right'
      icon: '🚀',              // Optional emoji or SVG path
      color: '#7048e8',
      line: true,              // Draw a vertical line to the point
    }
  ]
}
```

### Implementation

Annotations render in a final pass, on top of everything else. Each annotation consists of:
1. An optional vertical/horizontal line from the axis to the data point
2. A label badge positioned relative to the data point
3. An optional icon

---

## Design Tokens

The ERP-grade visual system. These are the defaults that make charts look professional out of the box.

### Color System

```javascript
// Semantic palette (status)
semantic: {
  good: '#0ca678',
  warning: '#f08c00',
  critical: '#e03131',
  neutral: '#868e96',
  info: '#4c6ef5',
}

// Data palette (10 colors, optimized for contrast)
data: ['#4c6ef5','#0ca678','#f08c00','#e03131','#7048e8','#1098ad','#d6336c','#5c7cfa','#20c997','#fcc419']

// Compare palette (for previous period / baseline)
compare: '#b3bac5'

// Surface palette (backgrounds, borders)
surface: {
  background: '#f5f6f8',
  card: '#ffffff',
  border: '#dfe1e6',
  borderLight: '#ebecf0',
  hover: 'rgba(76, 110, 245, 0.04)',
}
```

### Typography

```javascript
typography: {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  monoFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  sizes: {
    xs: 9,      // reference line labels, footnotes
    sm: 10,     // axis labels, legend items
    md: 12,     // tooltip text, table cells
    lg: 14,     // chart title
    xl: 18,     // KPI values
    xxl: 24,    // dashboard hero number
  }
}
```

### Spacing and Sizing

```javascript
spacing: {
  toolbarHeight: 40,
  legendGap: 4,
  chartPadding: { top: 16, right: 16, bottom: 40, left: 56 },
  barRadius: 2,         // Subtle, not rounded
  dotRadius: { normal: 4, hover: 6, sparkline: 2 },
  referenceLabel: { padding: '2px 6px', borderRadius: 3 },
}
```

### Animation Defaults

```javascript
animation: {
  duration: 450,         // Slightly faster than "demo" charts
  easing: 'easeOutCubic',
  staggerDelay: 25,      // ms between bars/slices
  drillTransition: 200,  // Crossfade on drill-down
}
```
