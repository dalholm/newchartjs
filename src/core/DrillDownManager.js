/**
 * DrillDownManager — navigation stack and data resolution for drill-down charts.
 * Pure state class with no DOM dependencies.
 */

export class DrillDownManager {
  /**
   * @param {Object} options
   * @param {Object} options.data - Root chart data ({ labels, datasets, children? })
   * @param {Function} [options.onDrillDown] - Async callback: ({ label, level, path }) => Promise<data>
   * @param {string} [options.rootLabel] - Label for the root level
   */
  constructor({ data, onDrillDown = null, rootLabel = 'Root' }) {
    this._stack = [{ label: rootLabel, data }];
    this._onDrillDown = onDrillDown;
    this._loading = false;
  }

  /** @returns {Object} Data at the current drill level */
  get currentData() {
    return this._stack[this._stack.length - 1].data;
  }

  /** @returns {number} Current depth (0 = root) */
  get currentLevel() {
    return this._stack.length - 1;
  }

  /** @returns {string[]} Label trail from root to current level */
  get path() {
    return this._stack.map(entry => entry.label);
  }

  /** @returns {{ label: string, level: number }[]} Items for breadcrumb rendering */
  get breadcrumbItems() {
    return this._stack.map((entry, i) => ({ label: entry.label, level: i }));
  }

  /** @returns {boolean} True during async data resolution */
  get isLoading() {
    return this._loading;
  }

  /**
   * Check whether a label can be drilled into
   * @param {string} label - The bar label to check
   * @returns {boolean}
   */
  canDrillDown(label) {
    const children = this.currentData.children;
    if (children && children[label]) return true;
    if (this._onDrillDown) return true;
    return false;
  }

  /**
   * Drill into a child level. Resolves data from children map or async callback.
   * @param {string} label - The bar label to drill into
   * @returns {Promise<Object>} The child data
   * @throws {Error} If no data source provides child data
   */
  async drillDown(label) {
    // Try client-side children first
    const children = this.currentData.children;
    if (children && children[label]) {
      const childData = children[label];
      this._stack.push({ label, data: childData });
      return childData;
    }

    // Try async callback
    if (this._onDrillDown) {
      this._loading = true;
      try {
        const childData = await this._onDrillDown({
          label,
          level: this.currentLevel + 1,
          path: [...this.path, label]
        });
        if (!childData) {
          throw new Error(`onDrillDown returned no data for "${label}"`);
        }
        this._stack.push({ label, data: childData });
        return childData;
      } finally {
        this._loading = false;
      }
    }

    throw new Error(`No drill-down data available for "${label}"`);
  }

  /**
   * Navigate back to a specific level
   * @param {number} level - Target level (0 = root)
   */
  navigateTo(level) {
    if (level < 0) level = 0;
    if (level >= this._stack.length) return;
    this._stack = this._stack.slice(0, level + 1);
  }

  /** @returns {boolean} True if not at root level */
  canGoBack() {
    return this._stack.length > 1;
  }

  /** Navigate back to root */
  reset() {
    this.navigateTo(0);
  }
}

export default DrillDownManager;
