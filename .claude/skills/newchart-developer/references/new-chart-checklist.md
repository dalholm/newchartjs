# New Chart Type Checklist

Follow this checklist when adding a new chart type to NewChart JS.

## 1. Create the Chart Class

File: `src/charts/NewType.js`

```javascript
import Chart from '../core/Chart.js';
import { NEWTYPE_DEFAULTS } from '../core/defaults.js';

export default class NewTypeChart extends Chart {
  constructor(element, config = {}) {
    super(element, config, NEWTYPE_DEFAULTS);
  }

  render(progress) {
    // Clear previous frame
    this.renderer.clear();

    // Calculate layout (margins, chart area, scales)
    // ...

    // Render grid/axes (if applicable)
    // ...

    // Render data elements with animation progress (0→1)
    // ...

    // Render reference lines (if supported)
    // this._renderReferenceLines();

    // Render hover overlays (if applicable)
    // ...
  }
}
```

## 2. Add Defaults

File: `src/core/defaults.js`

- Create `NEWTYPE_DEFAULTS` extending `DEFAULT_CONFIG`
- Add type-specific style properties under `style.newtype`
- Add type-specific options
- Export the new defaults

## 3. Register in Entry Point

File: `src/index.js`

- Import the chart class
- Add case to the `create()` factory switch
- Add as property: `NewChart.NewTypeChart = NewTypeChart;`

## 4. Verify Compliance

Before considering the chart complete, verify:

- [ ] Extends `Chart` base class correctly
- [ ] Uses `this.renderer` for all drawing (never creates SVG/Canvas elements directly)
- [ ] Respects `progress` parameter for animation (0 = start, 1 = complete)
- [ ] Uses `this.palette(index)` for colors
- [ ] Handles empty data gracefully (no errors, shows empty state)
- [ ] Handles single data point
- [ ] Works with both SVG and Canvas renderer
- [ ] Tooltip integration (responds to mouse events)
- [ ] Legend integration (shows in legend, respects visibility toggle)
- [ ] Responsive resize works (test by resizing browser)
- [ ] Config follows `{ type, data, style, options }` pattern
- [ ] JSDoc on all public methods
- [ ] Added to demo page

## 5. Update Demo

File: `demo/index.html`

Add a new section showcasing the chart type with realistic data.

## 6. Build and Test

```bash
npm run build
# Open demo/index.html in browser
# Test: resize, hover, click legend, empty data, large data
```
