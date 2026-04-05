/**
 * NetworkBall Chart — AI Network Sphere Visualization
 *
 * A 3D rotating sphere of interconnected nodes. Multiple cursors travel
 * between nodes in parallel, lighting up connections as they go.
 */

import { Chart } from '../core/Chart.js';
import { deepMerge } from '../core/utils.js';
import { NETWORKBALL_DEFAULTS } from '../core/defaults.js';

/** Default AI activity verbs */
const AI_VERBS = [
  'evaluating', 'connecting', 'reasoning', 'analyzing', 'processing',
  'thinking', 'deciding', 'learning', 'classifying', 'predicting',
  'optimizing', 'synthesizing', 'inferring', 'correlating', 'mapping',
  'indexing', 'embedding', 'encoding', 'decoding', 'transforming',
  'clustering', 'scoring', 'ranking', 'resolving', 'validating'
];

/**
 * Parse hex to [r,g,b]
 * @param {string} hex
 * @returns {number[]}
 */
function parseHex(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}

/**
 * Unique key for a node pair (order-independent)
 * @param {number} a
 * @param {number} b
 * @returns {string}
 */
function edgeKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export default class NetworkBallChart extends Chart {
  constructor(element, config = {}) {
    const merged = deepMerge(NETWORKBALL_DEFAULTS, config);
    super(element, merged);
  }

  shouldUseCanvas() {
    return true;
  }

  draw() {
    this.cancelAnimations();
    this.removeElementListeners();

    if (!this.canvas) {
      this.canvas = this.renderer.getCanvas();
      this.ctx = this.canvas.getContext('2d');
    }

    this.initNodes();
    this.initConnections();
    this.cacheColors();

    this.rotation = { x: 0.3, y: 0 };
    this.litEdges = new Map();
    this.cursors = [];
    this.litNodes = new Map();
    this._sortIndices = this.nodes.map((_, i) => i);

    this.startLoop();
  }

  render() {}

  cacheColors() {
    const cfg = this.config.style.networkball;
    this._colors = {
      node: parseHex(cfg.nodeColor),
      active: parseHex(cfg.activeColor),
      ring: parseHex(cfg.ringColor || '#c8cdd6')
    };
  }

  /**
   * Place nodes on a Fibonacci sphere
   */
  initNodes() {
    const cfg = this.config.style.networkball;
    const count = this.config.data.nodeCount || cfg.nodeCount;
    this.nodes = [];

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // -1 to 1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;

      this.nodes.push({
        // Unit sphere coordinates (static)
        sx: Math.cos(theta) * radiusAtY,
        sy: y,
        sz: Math.sin(theta) * radiusAtY,
        // Screen coordinates (updated each frame)
        x: 0, y: 0, z: 0
      });
    }
  }

  /**
   * Pre-compute connections using 3D distance on unit sphere
   */
  initConnections() {
    const cfg = this.config.style.networkball;
    const maxDist = cfg.connectionDistance;
    const maxDistSq = maxDist * maxDist;

    this.connections = [];
    this.neighbors = [];

    // Build neighbor lists
    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      const nearby = [];

      for (let j = 0; j < this.nodes.length; j++) {
        if (i === j) continue;
        const b = this.nodes[j];
        const dx = a.sx - b.sx;
        const dy = a.sy - b.sy;
        const dz = a.sz - b.sz;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDistSq) {
          nearby.push({ index: j, distSq });
        }
      }

      nearby.sort((a, b) => a.distSq - b.distSq);
      this.neighbors.push(nearby.map(n => n.index));
    }

    // Deduplicated connection list
    const seen = new Set();
    for (let i = 0; i < this.neighbors.length; i++) {
      for (const j of this.neighbors[i]) {
        const key = edgeKey(i, j);
        if (!seen.has(key)) {
          seen.add(key);
          this.connections.push({ from: i, to: j, key });
        }
      }
    }
  }

  startLoop() {
    if (this._loopId) cancelAnimationFrame(this._loopId);

    const cfg = this.config.style.networkball;
    let lastTime = 0;

    const loop = (time) => {
      const dt = lastTime ? (time - lastTime) / 1000 : 0.016;
      lastTime = time;

      this.updateProjection(dt, cfg);
      this.updateState(dt, cfg);
      this.renderFrame(cfg);

      this._loopId = requestAnimationFrame(loop);
    };

    this._loopId = requestAnimationFrame(loop);
  }

  /**
   * Rotate sphere and project nodes to 2D screen coordinates
   * @param {number} dt
   * @param {Object} cfg
   */
  updateProjection(dt, cfg) {
    this.rotation.y += (cfg.rotationSpeed || 0.4) * dt;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius = Math.min(cx, cy) * cfg.sphereScale;
    const cosY = Math.cos(this.rotation.y);
    const sinY = Math.sin(this.rotation.y);
    const cosX = Math.cos(this.rotation.x);
    const sinX = Math.sin(this.rotation.x);

    for (const node of this.nodes) {
      // Rotate around Y
      const x1 = node.sx * cosY - node.sz * sinY;
      const z1 = node.sx * sinY + node.sz * cosY;
      // Rotate around X
      const y1 = node.sy * cosX - z1 * sinX;
      const z2 = node.sy * sinX + z1 * cosX;

      node.x = cx + x1 * radius;
      node.y = cy + y1 * radius;
      node.z = z2; // -1 (back) to 1 (front)
    }
  }

  /**
   * Update cursors, edge energy, node energy
   * @param {number} dt
   * @param {Object} cfg
   */
  updateState(dt, cfg) {
    const speed = cfg.travelerSpeed || 1.2;
    const decay = cfg.energyDecay || 1.5;

    // Decay lit edges
    for (const [key, energy] of this.litEdges) {
      const next = energy - dt * decay;
      if (next <= 0) {
        this.litEdges.delete(key);
      } else {
        this.litEdges.set(key, next);
      }
    }

    // Decay lit nodes
    for (const [key, val] of this.litNodes) {
      const next = val - dt * decay;
      if (next <= 0) {
        this.litNodes.delete(key);
      } else {
        this.litNodes.set(key, next);
      }
    }

    // Update cursors
    const alive = [];
    for (const cur of this.cursors) {
      cur.progress += dt * speed;

      if (cur.progress >= 1) {
        this.litNodes.set(cur.targetNode, 1);
        cur.hops++;

        if (cur.hops >= (cfg.travelerMaxHops || 5)) {
          continue;
        }

        if (this.advanceCursor(cur)) {
          alive.push(cur);
        }
      } else {
        alive.push(cur);
      }
    }

    this.cursors = alive;
  }

  /**
   * Advance cursor to next node
   * @param {Object} cur
   * @returns {boolean}
   */
  advanceCursor(cur) {
    const neighborList = this.neighbors[cur.targetNode];
    if (!neighborList || neighborList.length === 0) return false;

    let nextIdx = -1;
    for (const n of neighborList) {
      if (n !== cur.sourceNode && !cur.visited.has(n)) {
        nextIdx = n;
        break;
      }
    }

    if (nextIdx === -1) {
      for (const n of neighborList) {
        if (n !== cur.sourceNode) { nextIdx = n; break; }
      }
    }

    if (nextIdx === -1) nextIdx = neighborList[0];

    this.litEdges.set(edgeKey(cur.targetNode, nextIdx), 1);

    cur.visited.add(cur.targetNode);
    cur.sourceNode = cur.targetNode;
    cur.targetNode = nextIdx;
    cur.progress = 0;
    cur.label = this.pickVerb();
    return true;
  }

  /**
   * Render one frame
   * @param {Object} cfg
   */
  renderFrame(cfg) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Background
    const bg = this.config.style.background;
    if (bg && bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Connections (idle + lit)
    this.drawConnections(ctx, cfg);

    // Depth-sort nodes (insertion sort, nearly sorted → O(n))
    const indices = this._sortIndices;
    const nodes = this.nodes;
    for (let i = 1; i < indices.length; i++) {
      const key = indices[i];
      const keyZ = nodes[key].z;
      let j = i - 1;
      while (j >= 0 && nodes[indices[j]].z > keyZ) {
        indices[j + 1] = indices[j];
        j--;
      }
      indices[j + 1] = key;
    }

    // Nodes (back to front)
    for (let i = 0; i < indices.length; i++) {
      this.drawNode(ctx, cfg, indices[i]);
    }

    // Cursors (on top)
    for (const cur of this.cursors) {
      this.drawCursor(ctx, cfg, cur);
    }
  }

  /**
   * Draw idle connections and lit connections in two passes
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} cfg
   */
  drawConnections(ctx, cfg) {
    const nc = this._colors.node;
    const ac = this._colors.active;
    const nodes = this.nodes;

    // Pass 1: idle
    ctx.lineWidth = cfg.connectionWidth;
    for (const conn of this.connections) {
      const a = nodes[conn.from];
      const b = nodes[conn.to];
      const avgZ = (a.z + b.z) / 2;
      const depthAlpha = 0.15 + 0.85 * ((avgZ + 1) / 2);

      ctx.globalAlpha = cfg.connectionOpacity * depthAlpha;
      ctx.strokeStyle = `rgb(${nc[0]},${nc[1]},${nc[2]})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Pass 2: lit
    for (const conn of this.connections) {
      const e = this.litEdges.get(conn.key);
      if (!e) continue;

      const a = nodes[conn.from];
      const b = nodes[conn.to];
      const avgZ = (a.z + b.z) / 2;
      const depthAlpha = 0.3 + 0.7 * ((avgZ + 1) / 2);

      ctx.strokeStyle = `rgba(${ac[0]},${ac[1]},${ac[2]},${e * 0.7 * depthAlpha})`;
      ctx.lineWidth = cfg.connectionWidth + e * 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Draw a single node with depth-based opacity/size
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} cfg
   * @param {number} index
   */
  drawNode(ctx, cfg, index) {
    const node = this.nodes[index];
    const depthFactor = (node.z + 1) / 2; // 0 back, 1 front
    const r = cfg.nodeRadius * (0.4 + 0.6 * depthFactor);
    const alpha = 0.2 + 0.8 * depthFactor;

    const nc = this._colors.node;
    const ac = this._colors.active;
    const energy = this.litNodes.get(index) || 0;

    if (energy > 0) {
      // Glow halo
      ctx.globalAlpha = energy * 0.2 * alpha;
      ctx.fillStyle = `rgb(${ac[0]},${ac[1]},${ac[2]})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + energy * cfg.glowRadius, 0, 6.2832);
      ctx.fill();

      // Core — lerp toward active color
      const cr = nc[0] + (ac[0] - nc[0]) * energy | 0;
      const cg = nc[1] + (ac[1] - nc[1]) * energy | 0;
      const cb = nc[2] + (ac[2] - nc[2]) * energy | 0;
      ctx.globalAlpha = alpha * (0.6 + energy * 0.4);
      ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * (1 + energy * 0.3), 0, 6.2832);
      ctx.fill();
    } else {
      ctx.globalAlpha = alpha * cfg.nodeOpacity;
      ctx.fillStyle = `rgb(${nc[0]},${nc[1]},${nc[2]})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 6.2832);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Draw a cursor with depth awareness
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} cfg
   * @param {Object} cur
   */
  drawCursor(ctx, cfg, cur) {
    const a = this.nodes[cur.sourceNode];
    const b = this.nodes[cur.targetNode];
    const p = cur.progress;
    const ep = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);

    const x = a.x + (b.x - a.x) * ep;
    const y = a.y + (b.y - a.y) * ep;
    const z = a.z + (b.z - a.z) * ep;

    // Keep connection lit while traveling
    this.litEdges.set(edgeKey(cur.sourceNode, cur.targetNode), 1);

    const depthFactor = (z + 1) / 2;
    const alpha = 0.3 + 0.7 * depthFactor;
    const ac = this._colors.active;
    const r = cfg.nodeRadius * (1 + 0.6 * depthFactor);

    // Outer glow
    ctx.globalAlpha = 0.12 * alpha;
    ctx.fillStyle = `rgb(${ac[0]},${ac[1]},${ac[2]})`;
    ctx.beginPath();
    ctx.arc(x, y, r + cfg.glowRadius * 0.7, 0, 6.2832);
    ctx.fill();

    // Mid glow
    ctx.globalAlpha = 0.25 * alpha;
    ctx.beginPath();
    ctx.arc(x, y, r + cfg.glowRadius * 0.25, 0, 6.2832);
    ctx.fill();

    // Core
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${ac[0]},${ac[1]},${ac[2]})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fill();

    // White center
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.6 * alpha;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.3, 0, 6.2832);
    ctx.fill();

    // Label — only show when cursor is on the front half
    const fontSize = cfg.labelFontSize || 10;
    if (cur.label && fontSize > 0 && z > -0.1) {
      const fontFamily = this.config.style.fontFamily || 'sans-serif';
      ctx.font = `500 ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      const labelY = y - r - cfg.glowRadius * 0.4 - 4;
      const text = cur.label;
      const metrics = ctx.measureText(text);
      const pw = metrics.width + 10;
      const ph = fontSize + 6;
      const px = x - pw / 2;
      const py = labelY - ph + 2;
      const pr = ph / 2;

      ctx.globalAlpha = 0.5 * depthFactor;
      ctx.fillStyle = `rgb(${ac[0]},${ac[1]},${ac[2]})`;
      ctx.beginPath();
      ctx.moveTo(px + pr, py);
      ctx.lineTo(px + pw - pr, py);
      ctx.arc(px + pw - pr, py + pr, pr, -1.5708, 1.5708);
      ctx.lineTo(px + pr, py + ph);
      ctx.arc(px + pr, py + pr, pr, 1.5708, -1.5708);
      ctx.fill();

      ctx.globalAlpha = depthFactor;
      ctx.fillStyle = '#fff';
      ctx.fillText(text, x, labelY);
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Pick a random AI verb, avoiding repeats
   * @returns {string}
   */
  pickVerb() {
    let verb;
    do {
      verb = AI_VERBS[Math.floor(Math.random() * AI_VERBS.length)];
    } while (verb === this._lastVerb);
    this._lastVerb = verb;
    return verb;
  }

  /**
   * Push an event — spawns a cursor that travels between nodes.
   * Multiple cursors run in parallel.
   *
   * @param {Object} [event] - Event configuration
   * @param {string} [event.label] - Starting label (auto-generated if omitted)
   * @param {number} [event.node] - Starting node index (random if omitted)
   * @returns {NetworkBallChart} this
   */
  pushEvent(event = {}) {
    const sourceIdx = event.node ?? Math.floor(Math.random() * this.nodes.length);
    const neighborList = this.neighbors[sourceIdx];
    if (!neighborList || neighborList.length === 0) return this;

    this.litNodes.set(sourceIdx, 1);

    const targetIdx = neighborList[Math.floor(Math.random() * Math.min(3, neighborList.length))];
    this.litEdges.set(edgeKey(sourceIdx, targetIdx), 1);

    this.cursors.push({
      sourceNode: sourceIdx,
      targetNode: targetIdx,
      progress: 0,
      hops: 0,
      label: event.label || this.pickVerb(),
      visited: new Set([sourceIdx])
    });

    return this;
  }

  /**
   * Push multiple events
   * @param {number} count
   * @param {number} [interval=200]
   * @returns {NetworkBallChart} this
   */
  burst(count = 5, interval = 200) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.pushEvent(), i * interval);
    }
    return this;
  }

  /**
   * Start automatic events
   * @param {number} [intervalMs=2000]
   * @returns {NetworkBallChart} this
   */
  startAutoEvents(intervalMs = 2000) {
    this.stopAutoEvents();

    const fire = () => {
      this.pushEvent();
      const next = intervalMs * (0.6 + Math.random() * 0.8);
      this._autoEventTimer = setTimeout(fire, next);
    };

    fire();
    return this;
  }

  /**
   * Stop automatic events
   * @returns {NetworkBallChart} this
   */
  stopAutoEvents() {
    if (this._autoEventTimer) {
      clearTimeout(this._autoEventTimer);
      this._autoEventTimer = null;
    }
    return this;
  }

  destroy() {
    this.stopAutoEvents();
    if (this._loopId) {
      cancelAnimationFrame(this._loopId);
      this._loopId = null;
    }
    super.destroy();
  }
}
