/**
 * NewChart Demo — SPA Entry Point
 * Registers all routes and starts the router.
 */
import router from './router.js';
import galleryView from './views/gallery.js';
import barView from './views/bar.js';
import lineView from './views/line.js';
import areaView from './views/area.js';
import pieView from './views/pie.js';
import gaugeView from './views/gauge.js';
import sparklineView from './views/sparkline.js';
import comboView from './views/combo.js';
import scatterView from './views/scatter.js';
import kpicardView from './views/kpicard.js';
import networkballView from './views/networkball.js';
import dashboardView from './views/dashboard.js';
import trendbadgeView from './views/trendbadge.js';
import funnelView from './views/funnel.js';
import waterfallView from './views/waterfall.js';
import heatmapView from './views/heatmap.js';
import cohortView from './views/cohort.js';
import bulletView from './views/bullet.js';
import sankeyView from './views/sankey.js';
import treemapView from './views/treemap.js';
import rangeView from './views/range.js';
import kpicomparisonView from './views/kpicomparison.js';

// Register routes
router.register('/', galleryView);
router.register('/bar', barView);
router.register('/line', lineView);
router.register('/area', areaView);
router.register('/pie', pieView);
router.register('/gauge', gaugeView);
router.register('/sparkline', sparklineView);
router.register('/combo', comboView);
router.register('/scatter', scatterView);
router.register('/kpicard', kpicardView);
router.register('/networkball', networkballView);
router.register('/trendbadge', trendbadgeView);
router.register('/dashboard', dashboardView);
router.register('/funnel', funnelView);
router.register('/waterfall', waterfallView);
router.register('/heatmap', heatmapView);
router.register('/cohort', cohortView);
router.register('/bullet', bulletView);
router.register('/sankey', sankeyView);
router.register('/treemap', treemapView);
router.register('/range', rangeView);
router.register('/kpicomparison', kpicomparisonView);

// Start
router.start();
