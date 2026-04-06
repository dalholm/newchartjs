# ERP Dashboard Demo Reference

This document describes the interactive ERP dashboard prototype we've already validated. The skill agent should use this as the target experience when implementing features in NewChart JS.

## What the Demo Shows

A Sovfabriken (e-commerce) sales dashboard with:

### KPI Cards Row
Four cards across the top, each showing:
- Label (uppercase, 10px, muted)
- Value (22px, mono font, bold)
- YoY change badge (green ▲ / red ▼ with percentage)
- Previous period value (10px, faint)
- **Sparkline** (64×22px inline trend chart, last 12 months)
- **Progress bar** (3px, semantic color vs. budget target)
- **Status dot** (8px circle: green if ≥ target, yellow if ≥ 90%, red if below)

Cards are clickable — selecting a KPI changes the metric displayed in the main chart.

### Main Chart Area

Wrapped in a card with:

**Tab bar** at the top: "Tidserie" | "Fördelning" — underline-style active indicator

**Live indicator** in the tab bar right side: green dot + "Live · HH:MM"

**Chart Toolbar** (below tabs, inside the card):
- Left: title or breadcrumb navigation
- Right: chart-type switcher (bar ↔ line icons), view mode (Graf/Tabell/Delad), CSV export button

**Interactive Legend** (below toolbar):
- Clickable pills: "2026" (primary color), "2025" (gray, dashed marker), "Budget" (orange, dashed), "Snitt" (gray, dashed)
- Click toggles visibility, dimmed when hidden (opacity 0.5)

### Bar Chart (Tidserie view)

- Grouped bars: current year (primary blue, solid) + previous year (gray, lower opacity)
- **Reference lines**: budget average (dashed orange, labeled) + data average (dashed gray, labeled)
- **Per-bar budget markers**: short horizontal orange dashes at budget value for each month
- **Semantic status dots**: appear on hover above bars (green/yellow/red vs. budget)
- Hover: highlighted bar column with light primary background, value label above bar
- **Drill-down**: double-click a bar → zoom to weekly data → double-click again → daily data
- **Breadcrumb**: appears in toolbar when drilled: Home → "Mar" → "V2"
- **Sortable**: segmented control to sort bars (Kronologisk / Högst / Lägst)

### Line Chart (alternate view via toolbar)

- Smooth cardinal spline curves
- Area gradient fill under current year line
- Previous year as dashed line
- Crosshair on hover with data points highlighted
- Same legend, reference lines, and hover behavior as bar chart

### Table View (alternate view via toolbar)

- Full data table with columns: Period, Omsättning, Fg. period, Förändring (badge), Budget, Status (dot)
- Alternating row backgrounds
- Sticky header
- Hover row syncs with chart highlight
- Split view shows both chart and table simultaneously

### Donut Chart (Fördelning tab)

- True donut (not pie): outer radius + inner radius with center label
- Center shows: total value (or hovered slice percentage + label)
- Slice explodes outward on hover (translate along midpoint angle)
- **Segmented control**: "Per kanal" / "Per kategori" switches data source
- **Integrated data table** alongside donut (split layout)
- Table columns: Kanal/Kategori (with color dot), Omsättning, Andel %, YoY or Marginal %
- Hover syncs between donut slices and table rows
- Legend acts as filter — click to hide/show slices

### Footer

"Källa: Nyehandel Platform API · Alla belopp i SEK exkl. moms"

## Design Tokens Used

```
Primary:     #4c6ef5 (indigo-blue)
Success:     #0ca678 (green)
Danger:      #e03131 (red)
Warning:     #f08c00 (orange)
Neutral:     #868e96 (gray)
Compare:     #b3bac5 (light gray for previous period)

Background:  #f5f6f8
Surface:     #ffffff
Border:      #dfe1e6
BorderLight: #ebecf0

Text:        #172b4d
TextMuted:   #8993a4
TextFaint:   #b3bac5

Font:        Inter, system stack
Mono:        JetBrains Mono, SF Mono

Border radius: 4px (controls), 6px (cards), 8px (container)
Shadows:     0 1px 3px rgba(0,0,0,0.06)
```

## What This Maps To in NewChart JS

| Demo Feature | NewChart Implementation |
|---|---|
| KPI cards | User builds with HTML + `NewChart.sparkline()` |
| Bar chart | `NewChart.create('#el', { type: 'bar', ... })` with reference lines + toolbar |
| Line chart | Same instance, `chart.switchType('line')` via toolbar |
| Donut chart | `NewChart.create('#el', { type: 'pie', style: { pie: { innerRadius: 0.6 } } })` |
| Table view | `options.toolbar.actions.viewMode: true` → table rendered by chart |
| Drill-down | `options.drillDown.onDrill: callback` |
| Legend filter | `options.legend.interactive: true` |
| Reference lines | `options.referenceLines: [...]` |
| Semantic colors | `options.semanticColors: { target: 'budget', ... }` |
| CSV export | `options.toolbar.actions.export: ['csv']` |
