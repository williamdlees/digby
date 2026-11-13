import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QtlService } from '../qtl.service';
import { QtlVariantComponent } from './qtl-variant.component';

describe('QTL variant', () => {
  const api = { variant: vi.fn(), variantUsage: vi.fn() };
  let component: QtlVariantComponent;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: QtlService, useValue: api }] });
    component = new QtlVariantComponent(TestBed.inject(QtlService));
    component.selection = { species: 'Human', locus: 'IGH', variant: 'v1' };
    component.fallbackAsc = 'V1';
  });

  it('builds genotype plots and export rows from the selected variant', () => {
    api.variant.mockReturnValue(of({
      variant: { variant: 'v1' }, associations: [{ significant: true }, { significant: false }],
      has_genotypes: true,
      dbsnp: { mapped: true, applies: true, rsids: ['rs1', 'rs2'], grch38: { contig: 'chr14', pos: 123 } },
    }));
    api.variantUsage.mockReturnValue(of({
      subjects: [
        { subject: 's1', genotype: 0, usage: 0.1 },
        { subject: 's2', genotype: 1, usage: 0.2 },
        { subject: 's3', genotype: null, usage: null },
      ],
      association: null,
    }));
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    expect(api.variantUsage).toHaveBeenCalledWith('Human', 'IGH', 'v1', 'V1');
    expect(component.counts).toEqual([
      { genotype: 0, label: '0/0', n: 1 }, { genotype: 1, label: '0/1', n: 1 },
    ]);
    expect(component.usageTable.rows).toEqual([['s1', '0/0', 0.1], ['s2', '0/1', 0.2]]);
    expect(component.plotData).toEqual([
      expect.objectContaining({ name: '0/0  (n=1)', y: [0.1], text: ['s1'] }),
      expect.objectContaining({ name: '0/1  (n=1)', y: [0.2], text: ['s2'] }),
    ]);
    expect(component.outsideLinks.map(link => link.label)).toEqual(['rs1', 'rs2', 'chr14:123']);
    expect(component.significantCount).toBe(1);
    component.significantOnly = true;
    expect(component.shownAssociations).toHaveLength(1);
    expect(component.hasGenotypes).toBe(true);
    expect(component.isFetching).toBe(false);
  });

  it('retains detail when usage is unavailable and reports detail failures', () => {
    api.variant.mockReturnValueOnce(of({ variant: { variant: 'v1' } }))
      .mockReturnValueOnce(throwError(() => ({ error: { message: 'not found' } })));
    api.variantUsage.mockReturnValue(throwError(() => new Error('unavailable')));
    const change = { selection: new SimpleChange(null, component.selection, true) };
    component.ngOnChanges(change);
    expect(component.variant.variant).toBe('v1');
    expect(component.plotData).toEqual([]);
    component.ngOnChanges(change);
    expect(component.error).toBe('not found');
    expect(component.isFetching).toBe(false);
  });

  it('does not fetch an incomplete selection or request usage without a gene', () => {
    component.selection = { species: 'Human', locus: 'IGH' };
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    expect(api.variant).not.toHaveBeenCalled();
    expect(component.variant).toBeNull();

    component.selection = { species: 'Human', locus: 'IGH', variant: 'v1' };
    component.fallbackAsc = undefined;
    api.variant.mockReturnValue(of({ variant: { variant: 'v1' }, associations: [] }));
    component.ngOnChanges({ fallbackAsc: new SimpleChange('V1', undefined, false) });
    expect(api.variantUsage).not.toHaveBeenCalled();
    expect(component.variant.variant).toBe('v1');
    expect(component.subjects).toEqual([]);
    expect(component.outsideLinks).toEqual([]);
    expect(component.shownAssociations).toEqual([]);
  });

  it('uses the selected gene over the fallback and exports complete genotype rows', () => {
    component.selection.asc = 'V2';
    api.variant.mockReturnValue(of({
      variant: { variant: 'v1' }, associations: [{ significant: false }],
      dbsnp: { mapped: true, applies: true, rsids: ['rs1'], grch38: null },
    }));
    api.variantUsage.mockReturnValue(of({
      subjects: [
        { subject: 's1', genotype: 2, usage: 0.4 },
        { subject: 's2', genotype: 2, usage: null },
        { subject: 's3', genotype: null, usage: 0.2 },
        { subject: 's4', genotype: 3, usage: 0.5 },
      ],
      association: null,
    }));
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    expect(api.variantUsage).toHaveBeenCalledWith('Human', 'IGH', 'v1', 'V2');
    expect(component.counts).toEqual([{ genotype: 2, label: '1/1', n: 2 }]);
    expect(component.usageTable.rows).toEqual([['s1', '1/1', 0.4], ['s4', '', 0.5]]);
    expect(component.outsideLinks.map(link => link.label)).toEqual(['rs1']);
    expect(component.shownAssociations).toHaveLength(1);
    component.significantOnly = true;
    expect(component.shownAssociations).toEqual([]);
  });

  it('uses the general error message when variant details provide none', () => {
    api.variant.mockReturnValue(throwError(() => ({ status: 400 })));
    api.variantUsage.mockReturnValue(of({ subjects: [], association: null }));
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    expect(component.error).toBe('Could not load this variant');
    expect(component.isFetching).toBe(false);
  });

  it('includes fit and power information in the exported usage script', async () => {
    api.variant.mockReturnValue(of({ variant: { variant: 'v1' } }));
    api.variantUsage.mockReturnValue(of({
      subjects: [{ subject: 's1', genotype: 0, usage: 0.1 }],
      association: { beta: 0.1234, p_value: 0.001, n: 20, min_genotype_group: 2, well_powered: false },
    }));
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    const createUrl = vi.fn((blob: Blob) => 'blob:test');
    class TestURL extends URL {
      static createObjectURL = createUrl;
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal('URL', TestURL);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      const button = component.plotConfig.modeBarButtonsToAdd[1];
      if (typeof button !== 'object' || button === null || !('click' in button) || typeof button.click !== 'function') {
        throw new Error('Expected Python export button');
      }
      button.click();
      const script = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(createUrl.mock.calls[0][0]);
      });
      expect(script).toContain('Effect 0.123, p 1.00e-3, n 20, smallest genotype class 2 (not well powered)');
      expect(script).toContain("['s1', '0/0', 0.1]");
    } finally {
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
