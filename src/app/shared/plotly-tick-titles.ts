/** Native tooltips on Plotly tick labels; with onClick, a label also opens what it names. */
export function attachTickTitles(host: Element, fullByLabel: Map<string, string>,
                                 onClick?: (full: string) => void): void {
  const ticks = host.querySelectorAll('.yaxislayer-above text');

  ticks.forEach(tick => {
    const label = Array.from(tick.childNodes)
      .filter(node => node.nodeType === 3)          // text nodes, not the <title>
      .map(node => node.nodeValue ?? '')
      .join('')
      .trim();

    const full = fullByLabel.get(label);
    const existing = tick.querySelector('title');
    const el = tick as SVGElement;

    // a property, not a listener, so a redraw replaces it instead of stacking another
    el.onclick = full && onClick ? () => onClick(full) : null;
    if (el.onclick) {
      el.style.pointerEvents = 'all';
      el.style.cursor = 'pointer';
    }

    // nothing to add where the tick already is the full name
    if (!full || full === label) {
      existing?.remove();
      if (!el.onclick) {
        el.style.removeProperty('cursor');
      }
      return;
    }

    const title = existing
      ?? tick.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = full;
    if (!existing) {
      tick.appendChild(title);
    }
    el.style.pointerEvents = 'all';
    el.style.cursor = el.onclick ? 'pointer' : 'help';
  });
}
