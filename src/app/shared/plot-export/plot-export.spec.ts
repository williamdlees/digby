import { exportButtons, python, safeStem, table, tsv } from './plot-export';
import { PlotExportComponent } from './plot-export.component';

describe('plot data export', () => {
  it('turns horizontal and vertical traces into labeled rows and omits gaps', () => {
    expect(table([{ name: 'study', x: [2, null, 4], y: ['a', 'b', 'c'], orientation: 'h' }],
      { xaxis: { title: { text: 'Count' } }, yaxis: { title: { text: 'Gene' } } }))
      .toEqual({ columns: ['Gene', 'series', 'Count'], rows: [['a', 'study', 2], ['c', 'study', 4]] });
    expect(table([{ x: ['a'], y: [1, 2] }], {}))
      .toEqual({ columns: ['category', 'value'], rows: [['a', 1], ['a', 2]] });
  });

  it('escapes TSV cells and emits code for chart data', () => {
    const data = { columns: ['gene', 'value'], rows: [['a\tb', 3]] };
    expect(tsv(data)).toBe('gene\tvalue\na b\t3\n');
    const script = python(data, { title: "Test's figure", source: '/api', kind: 'bar', horizontal: true });
    expect(script).toContain("ax.set_title('Test\\'s figure')");
    expect(script).toContain('df.plot.barh');
    expect(python(data, { title: 'box', source: '', kind: 'box', horizontal: false })).toContain('ax.boxplot');
    expect(safeStem('IGHV*01 / a')).toBe('IGHV-01-a');
  });

  it('exports labeled vertical bars and horizontal boxes with the correct axes', () => {
    const data = { columns: ['Gene', 'series', 'Count'], rows: [['V1', 'study', 2]] };
    const bar = python(data, { title: 'Bars', source: '/data', kind: 'bar', horizontal: false });
    expect(bar).toContain("wide = df.pivot_table(index='Gene', columns='series'");
    expect(bar).toContain('wide.plot.bar(ax=ax)');
    expect(bar).toContain("ax.set_xlabel('Gene')");
    expect(bar).toContain("ax.set_ylabel('Count')");

    const box = python(
      { columns: ['Gene', 'Count'], rows: [['V1', 2]] },
      { title: 'Boxes', source: '/data', kind: 'box', horizontal: true },
    );
    expect(box).toContain('ax.boxplot(data, labels=groups, vert=False)');
    expect(box).toContain("ax.set_xlabel('Count')");
    expect(box).toContain("ax.set_ylabel('Gene')");
  });

  it('downloads data and code through the plot buttons, and rejects empty data', () => {
    const createUrl = vi.fn((blob: Blob) => 'blob:test');
    const revokeUrl = vi.fn();
    class TestURL extends URL {
      static createObjectURL = createUrl;
      static revokeObjectURL = revokeUrl;
    }
    vi.stubGlobal('URL', TestURL);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      const buttons = exportButtons(() => ({ name: 'plot 1', title: 'Plot', data: [
        { x: ['a'], y: [3], type: 'bar' },
      ] })) as { click: () => void }[];
      buttons[0].click();
      buttons[1].click();
      expect(click).toHaveBeenCalledTimes(2);
      expect(createUrl.mock.calls.map(call => call[0].type)).toEqual([
        'text/tab-separated-values;charset=utf-8', 'text/x-python;charset=utf-8',
      ]);
      expect(revokeUrl).toHaveBeenCalledTimes(2);
      const empty = exportButtons(() => ({ name: 'empty', title: '' })) as { click: () => void }[];
      expect(() => empty[0].click()).toThrow('Nothing to export');
    } finally {
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('supports an explicit data table and script in the standalone export controls', () => {
    class TestURL extends URL {
      static createObjectURL = vi.fn(() => 'blob:test');
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal('URL', TestURL);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      const component = new PlotExportComponent();
      expect(component.rowCount).toBe(0);
      component.name = 'my figure';
      component.overrideTable = { columns: ['gene', 'value'], rows: [['V1', 2]] };
      component.overrideScript = 'print("custom")';
      expect(component.rowCount).toBe(1);
      component.downloadData();
      component.downloadCode();
      expect(click).toHaveBeenCalledTimes(2);
    } finally {
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('generates downloads from traces when no explicit export is supplied', async () => {
    const createUrl = vi.fn((blob: Blob) => 'blob:test');
    class TestURL extends URL {
      static createObjectURL = createUrl;
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal('URL', TestURL);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      const component = new PlotExportComponent();
      component.name = 'subject chart';
      component.source = '/api/usage';
      component.data = [{ type: 'bar', orientation: 'h', x: [3], y: ['V1'] }];
      component.layout = { xaxis: { title: { text: 'Count' } }, yaxis: { title: { text: 'Gene' } } };
      expect(component.rowCount).toBe(1);
      component.downloadData();
      component.downloadCode();
      expect(click).toHaveBeenCalledTimes(2);
      const text = await Promise.all(createUrl.mock.calls.map(([blob]) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
      })));
      expect(text[0]).toBe('Gene\tCount\nV1\t3\n');
      expect(text[1]).toContain("ax.set_title('subject chart')");
      expect(text[1]).toContain('df.plot.barh');
      expect(text[1]).toContain('/api/usage');
    } finally {
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
