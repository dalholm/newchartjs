/**
 * Sankey Chart implementation
 * Flow diagram with weighted curved links between nodes
 */

import Chart from '../core/Chart.js';
import { SANKEY_DEFAULTS } from '../core/defaults.js';
import { deepMerge } from '../core/utils.js';

export class SankeyChart extends Chart {
  constructor(element, config = {}) {
    const mergedConfig = deepMerge(SANKEY_DEFAULTS, config);
    super(element, mergedConfig);
  }

  /**
   * Layout nodes and links using a simple left-to-right algorithm
   * @returns {{ nodes: Array, links: Array }}
   */
  calculateLayout() {
    const { data, style, options } = this.config;
    const sankey = style.sankey || {};
    const padding = options.padding || 20;
    const topSpace = options.legend?.enabled ? 40 : 10;

    const nodes = data.nodes || [];
    const links = data.links || [];

    if (!nodes.length || !links.length) return { nodes: [], links: [] };

    const chartX = padding + 10;
    const chartY = topSpace + padding;
    const chartWidth = this.width - chartX - padding - 10;
    const chartHeight = this.height - chartY - padding;

    const nodeWidth = sankey.nodeWidth || 16;
    const nodePadding = sankey.nodePadding || 12;

    // Assign layers (column positions) via BFS
    const nodeMap = new Map();
    nodes.forEach((n, i) => nodeMap.set(n.id || n.label || i, {
      ...n,
      idx: i,
      layer: n.layer !== undefined ? n.layer : -1,
      inLinks: [],
      outLinks: [],
      value: 0
    }));

    links.forEach(link => {
      const src = nodeMap.get(link.source);
      const tgt = nodeMap.get(link.target);
      if (src && tgt) {
        src.outLinks.push(link);
        tgt.inLinks.push(link);
      }
    });

    // Auto-assign layers if not specified
    const unassigned = [...nodeMap.values()].filter(n => n.layer === -1);
    if (unassigned.length > 0) {
      // Find root nodes (no incoming)
      const roots = [...nodeMap.values()].filter(n => n.inLinks.length === 0);
      const visited = new Set();
      const queue = roots.map(n => ({ node: n, depth: 0 }));

      while (queue.length > 0) {
        const { node, depth } = queue.shift();
        const id = node.idx;
        if (visited.has(id)) continue;
        visited.add(id);
        if (node.layer === -1) node.layer = depth;

        node.outLinks.forEach(link => {
          const tgt = nodeMap.get(link.target);
          if (tgt && !visited.has(tgt.idx)) {
            queue.push({ node: tgt, depth: depth + 1 });
          }
        });
      }
    }

    // Calculate node values
    nodeMap.forEach(node => {
      const inVal = node.inLinks.reduce((s, l) => s + l.value, 0);
      const outVal = node.outLinks.reduce((s, l) => s + l.value, 0);
      node.value = Math.max(inVal, outVal);
    });

    // Group nodes by layer
    const layers = {};
    nodeMap.forEach(node => {
      if (!layers[node.layer]) layers[node.layer] = [];
      layers[node.layer].push(node);
    });

    const layerKeys = Object.keys(layers).map(Number).sort((a, b) => a - b);
    const layerCount = layerKeys.length;
    const layerSpacing = layerCount > 1 ? (chartWidth - nodeWidth) / (layerCount - 1) : 0;

    // Position nodes
    const totalValue = Math.max(...[...nodeMap.values()].map(n => n.value), 1);

    layerKeys.forEach((layerIdx, li) => {
      const layerNodes = layers[layerIdx];
      const layerTotal = layerNodes.reduce((s, n) => s + n.value, 0);
      const availableHeight = chartHeight - (layerNodes.length - 1) * nodePadding;
      const scale = availableHeight / (layerTotal || 1);

      let yOffset = chartY;
      layerNodes.forEach(node => {
        node.x = chartX + li * layerSpacing;
        node.y = yOffset;
        node.width = nodeWidth;
        node.height = Math.max(node.value * scale, 4);
        yOffset += node.height + nodePadding;
      });
    });

    // Calculate link positions
    const layoutLinks = links.map(link => {
      const src = nodeMap.get(link.source);
      const tgt = nodeMap.get(link.target);
      if (!src || !tgt) return null;

      const srcTotal = src.outLinks.reduce((s, l) => s + l.value, 0);
      const tgtTotal = tgt.inLinks.reduce((s, l) => s + l.value, 0);

      // Calculate vertical offsets within source/target nodes
      let srcOffset = 0;
      for (const l of src.outLinks) {
        if (l === link) break;
        srcOffset += (l.value / srcTotal) * src.height;
      }
      let tgtOffset = 0;
      for (const l of tgt.inLinks) {
        if (l === link) break;
        tgtOffset += (l.value / tgtTotal) * tgt.height;
      }

      const linkHeight = Math.max((link.value / srcTotal) * src.height, 1);
      const tgtLinkHeight = Math.max((link.value / tgtTotal) * tgt.height, 1);

      return {
        ...link,
        sx: src.x + src.width,
        sy: src.y + srcOffset,
        tx: tgt.x,
        ty: tgt.y + tgtOffset,
        sourceHeight: linkHeight,
        targetHeight: tgtLinkHeight,
        color: link.color || src.color || this.getPaletteColor(src.idx)
      };
    }).filter(Boolean);

    return {
      nodes: [...nodeMap.values()],
      links: layoutLinks
    };
  }

  /**
   * Render sankey chart
   */
  render() {
    const { style, options } = this.config;
    const sankey = style.sankey || {};
    const { nodes, links } = this.calculateLayout();

    if (!nodes.length) return;

    this._linkElements = [];
    this._nodeElements = [];

    // Draw links first (behind nodes)
    links.forEach((link, i) => {
      const midX = (link.sx + link.tx) / 2;
      const h1 = link.sourceHeight;
      const h2 = link.targetHeight;

      // Cubic bezier path for the flow
      const d = `M ${link.sx} ${link.sy}`
        + ` C ${midX} ${link.sy}, ${midX} ${link.ty}, ${link.tx} ${link.ty}`
        + ` L ${link.tx} ${link.ty + h2}`
        + ` C ${midX} ${link.ty + h2}, ${midX} ${link.sy + h1}, ${link.sx} ${link.sy + h1}`
        + ` Z`;

      const el = this.renderer.path(d, {
        fill: link.color,
        opacity: sankey.linkOpacity || 0.3
      });

      this._linkElements.push({ element: el, link });

      if (el) {
        el.style.cursor = 'pointer';
        el.style.transition = 'opacity 0.15s ease-out';

        this.addElementListener(el, 'mouseenter', (e) => {
          el.setAttribute('opacity', String(sankey.linkHoverOpacity || 0.6));

          this.showTooltip(e, {
            'Flow': `${link.source} → ${link.target}`,
            'Value': this.formatValue(link.value, null, 'tooltip')
          });
        });

        this.addElementListener(el, 'mouseleave', () => {
          el.setAttribute('opacity', String(sankey.linkOpacity || 0.3));
        });
      }
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      const color = node.color || this.getPaletteColor(node.idx);

      const el = this.renderer.rect(node.x, node.y, node.width, node.height, {
        fill: color,
        borderRadius: sankey.nodeRadius || 3
      });

      this._nodeElements.push({ element: el, node });

      // Node label
      const isRightSide = node.outLinks.length === 0;
      const labelX = isRightSide ? node.x + node.width + 6 : node.x - 6;
      const anchor = isRightSide ? 'start' : 'end';

      this.renderer.text(node.label || node.id, labelX, node.y + node.height / 2, {
        fill: style.fontColor,
        fontSize: style.fontSize || 11,
        fontFamily: style.fontFamily,
        textAnchor: anchor,
        dominantBaseline: 'middle',
        fontWeight: 500
      });

      // Value under label
      this.renderer.text(this.formatValue(node.value, null, 'label'), labelX, node.y + node.height / 2 + 14, {
        fill: style.axis?.color || '#6b7280',
        fontSize: 10,
        fontFamily: style.monoFamily || style.fontFamily,
        textAnchor: anchor,
        dominantBaseline: 'middle'
      });

      if (el) {
        el.style.cursor = 'pointer';

        this.addElementListener(el, 'mouseenter', (e) => {
          // Highlight connected links
          this._linkElements.forEach(({ element: lEl, link }) => {
            const connected = link.source === (node.id || node.label) ||
                            link.target === (node.id || node.label);
            lEl.setAttribute('opacity', connected ? '0.6' : '0.1');
          });

          this.showTooltip(e, {
            [node.label || node.id]: this.formatValue(node.value, null, 'tooltip')
          });
        });

        this.addElementListener(el, 'mouseleave', () => {
          this._linkElements.forEach(({ element: lEl }) => {
            lEl.setAttribute('opacity', String((style.sankey || {}).linkOpacity || 0.3));
          });
        });
      }
    });
  }

  /**
   * Animate links flowing in
   */
  animate() {
    const duration = this.config.style.animation?.duration || 600;

    if (this._linkElements?.length) {
      this._linkElements.forEach(({ element }, i) => {
        if (!element) return;
        element.setAttribute('opacity', '0');
        setTimeout(() => {
          element.style.transition = `opacity ${duration * 0.5}ms ease-out`;
          element.setAttribute('opacity', String((this.config.style.sankey || {}).linkOpacity || 0.3));
        }, 100 + i * 30);
      });
    }

    if (this._nodeElements?.length) {
      this._nodeElements.forEach(({ element }, i) => {
        if (!element) return;
        element.style.opacity = '0';
        element.style.transform = 'scaleY(0)';
        element.style.transformOrigin = 'center';
        element.style.transition = `opacity ${duration * 0.4}ms ease-out, transform ${duration * 0.6}ms cubic-bezier(0.34, 1.2, 0.64, 1)`;

        setTimeout(() => {
          element.style.opacity = '1';
          element.style.transform = 'scaleY(1)';
        }, i * 50);
      });
    }
  }
}

export default SankeyChart;
