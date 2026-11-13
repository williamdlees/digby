import { attachTickTitles } from './plotly-tick-titles';

describe('Plotly tick titles', () => {
  function chart(label: string): { host: HTMLDivElement; tick: SVGTextElement } {
    const host = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    layer.classList.add('yaxislayer-above');
    tick.textContent = label;
    layer.appendChild(tick);
    svg.appendChild(layer);
    host.appendChild(svg);
    return { host, tick };
  }

  it('adds a full-name tooltip and replaces the click handler on redraw', () => {
    const { host, tick } = chart('V1');
    const first = vi.fn();
    const second = vi.fn();
    attachTickTitles(host, new Map([['V1', 'IGHV1*01']]), first);
    expect(tick.querySelector('title')?.textContent).toBe('IGHV1*01');
    expect(tick.style.cursor).toBe('pointer');
    tick.dispatchEvent(new MouseEvent('click'));
    expect(first).toHaveBeenCalledWith('IGHV1*01');

    attachTickTitles(host, new Map([['V1', 'IGHV1*02']]), second);
    expect(tick.querySelectorAll('title')).toHaveLength(1);
    expect(tick.querySelector('title')?.textContent).toBe('IGHV1*02');
    tick.dispatchEvent(new MouseEvent('click'));
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledWith('IGHV1*02');
  });

  it('removes stale titles and handlers when the mapping disappears', () => {
    const { host, tick } = chart('V1');
    const click = vi.fn();
    attachTickTitles(host, new Map([['V1', 'IGHV1*01']]), click);
    attachTickTitles(host, new Map());
    expect(tick.querySelector('title')).toBeNull();
    expect(tick.style.cursor).toBe('');
    tick.dispatchEvent(new MouseEvent('click'));
    expect(click).not.toHaveBeenCalled();
  });

  it('uses a help cursor without a click handler and omits redundant titles', () => {
    const { host, tick } = chart('V1');
    attachTickTitles(host, new Map([['V1', 'IGHV1*01']]));
    expect(tick.querySelector('title')?.textContent).toBe('IGHV1*01');
    expect(tick.style.cursor).toBe('help');
    const click = vi.fn();
    attachTickTitles(host, new Map([['V1', 'V1']]), click);
    expect(tick.querySelector('title')).toBeNull();
    tick.dispatchEvent(new MouseEvent('click'));
    expect(click).toHaveBeenCalledWith('V1');
  });
});
