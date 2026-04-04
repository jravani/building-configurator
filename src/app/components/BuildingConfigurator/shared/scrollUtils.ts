// DOM scroll helpers shared by accordion components.

/** Walks up the DOM tree and returns the first scrollable ancestor. */
export function findScrollParent(node: HTMLElement | null): HTMLElement | null {
  let current = node?.parentElement ?? null;

  while (current) {
    const { overflowY } = window.getComputedStyle(current);
    const canScroll = overflowY === 'auto' || overflowY === 'scroll';

    if (canScroll && current.scrollHeight > current.clientHeight) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

/** Scrolls the nearest scrollable ancestor so that `node` is visible with `margin` padding. */
export function scrollIntoViewWithMargin(node: HTMLElement | null, margin = 24) {
  if (!node) return;

  const scrollParent = findScrollParent(node);

  if (!scrollParent) {
    node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  const nodeRect   = node.getBoundingClientRect();
  const parentRect = scrollParent.getBoundingClientRect();
  const topDelta   = nodeRect.top  - (parentRect.top  + margin);
  const bottomDelta = nodeRect.bottom - (parentRect.bottom - margin);

  if (bottomDelta > 0) {
    scrollParent.scrollBy({ top: bottomDelta, behavior: 'smooth' });
    return;
  }

  if (topDelta < 0) {
    scrollParent.scrollBy({ top: topDelta, behavior: 'smooth' });
  }
}

/**
 * Scrolls `node` into view after the current paint, then continues to adjust
 * for `duration` ms as the layout settles (e.g. during a CSS expand animation).
 */
export function scheduleScrollIntoView(node: HTMLElement | null, duration = 260) {
  if (!node) return;

  let frameId = 0;
  let timeoutId = 0;
  let resizeObserver: ResizeObserver | null = null;

  const runScroll = () => scrollIntoViewWithMargin(node);
  const cleanup = () => {
    if (frameId)   cancelAnimationFrame(frameId);
    if (timeoutId) window.clearTimeout(timeoutId);
    resizeObserver?.disconnect();
  };

  frameId = requestAnimationFrame(() => {
    runScroll();

    resizeObserver = new ResizeObserver(runScroll);
    resizeObserver.observe(node);

    timeoutId = window.setTimeout(cleanup, duration);
  });
}
