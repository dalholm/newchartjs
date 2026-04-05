/**
 * Animation engine using requestAnimationFrame
 */

const EASING_FUNCTIONS = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * (t - 2)) * (2 * (t - 2)) + 1,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
  easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
};

/**
 * Animate a value from start to end
 * @param {Object} options - Animation options
 * @param {number} options.from - Start value
 * @param {number} options.to - End value
 * @param {number} options.duration - Duration in ms
 * @param {string} options.easing - Easing function name
 * @param {Function} options.onUpdate - Callback on each frame
 * @param {Function} options.onComplete - Callback on animation complete
 * @returns {Function} Cancel function
 */
export function animate(options) {
  const {
    from = 0,
    to = 1,
    duration = 300,
    easing = 'easeOutCubic',
    onUpdate = () => {},
    onComplete = () => {}
  } = options;

  const easingFunc = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS.easeOutCubic;
  let startTime = null;
  let frameId = null;
  let cancelled = false;

  const frame = (currentTime) => {
    if (cancelled) return;

    if (startTime === null) {
      startTime = currentTime;
    }

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easingFunc(progress);
    const value = from + (to - from) * easedProgress;

    onUpdate(value, progress);

    if (progress < 1) {
      frameId = requestAnimationFrame(frame);
    } else {
      onComplete();
    }
  };

  frameId = requestAnimationFrame(frame);

  return () => {
    cancelled = true;
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
  };
}

/**
 * Animate multiple values simultaneously
 * @param {Object[]} animations - Array of animation objects
 * @param {Function} onUpdate - Callback receiving array of values
 * @param {Function} onComplete - Callback on complete
 * @returns {Function} Cancel function
 */
export function animateMultiple(animations, onUpdate, onComplete) {
  const values = animations.map(a => a.from);
  const cancellations = [];

  let completed = 0;

  animations.forEach((animConfig, index) => {
    const cancel = animate({
      ...animConfig,
      onUpdate: (value) => {
        values[index] = value;
        onUpdate([...values]);
      },
      onComplete: () => {
        completed++;
        if (completed === animations.length) {
          onComplete?.();
        }
      }
    });

    cancellations.push(cancel);
  });

  return () => {
    cancellations.forEach(cancel => cancel());
  };
}

/**
 * Spring physics animation
 * @param {Object} options - Spring options
 * @param {number} options.from - Start value
 * @param {number} options.to - End value
 * @param {number} options.stiffness - Spring stiffness (0.1-1)
 * @param {number} options.damping - Spring damping (0-1)
 * @param {Function} options.onUpdate - Update callback
 * @param {Function} options.onComplete - Complete callback
 * @returns {Function} Cancel function
 */
export function springAnimate(options) {
  const {
    from = 0,
    to = 1,
    stiffness = 0.1,
    damping = 0.5,
    onUpdate = () => {},
    onComplete = () => {}
  } = options;

  let value = from;
  let velocity = 0;
  let frameId = null;
  let cancelled = false;
  let settledFrames = 0;
  const SETTLE_THRESHOLD = 3; // Frames below movement threshold before settling

  const frame = () => {
    if (cancelled) return;

    const delta = to - value;
    const force = delta * stiffness;
    velocity += force;
    velocity *= 1 - damping;
    value += velocity;

    onUpdate(value);

    // Check if settled
    if (Math.abs(velocity) < 0.01 && Math.abs(delta) < 0.01) {
      settledFrames++;
      if (settledFrames >= SETTLE_THRESHOLD) {
        value = to;
        onUpdate(value);
        onComplete();
        return;
      }
    } else {
      settledFrames = 0;
    }

    frameId = requestAnimationFrame(frame);
  };

  frameId = requestAnimationFrame(frame);

  return () => {
    cancelled = true;
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
  };
}

/**
 * Delay execution
 * @param {number} duration - Duration in ms
 * @param {Function} callback - Callback to execute
 * @returns {Function} Cancel function
 */
export function delay(duration, callback) {
  const timeoutId = setTimeout(callback, duration);
  return () => clearTimeout(timeoutId);
}

export default {
  animate,
  animateMultiple,
  springAnimate,
  delay,
  EASING_FUNCTIONS
};
