import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QtlService } from '../qtl.service';
import { QtlPairingComponent } from './qtl-pairing.component';

describe('QTL pairing', () => {
  const api = { pairing: vi.fn() };
  let component: QtlPairingComponent;
  const box = { n: 10, min: 0, q1: 0.1, median: 0.2, q3: 0.3, max: 0.4, mean: 0.2 };

  beforeEach(() => {
    vi.resetAllMocks();
    api.pairing.mockReturnValue(of({
      anchors: ['IGHJ1', 'IGHJ2', 'IGHJ3', 'IGHJ4'],
      partners: ['IGHD1', 'IGHD2'],
      omnibus: {
        IGHJ1: { p_value: 0.1, neglog10_p: 1, significant: false },
        IGHJ2: { p_value: 0.001, neglog10_p: 3, significant: true, min_genotype_group: 10 },
      },
      cells: [{ anchor: 'IGHJ2', partner: 'IGHD1', genotype: 0, box }],
      marks: [{ anchor: 'IGHJ2', partner: 'IGHD1', marked: true, marked_strict: false, p_value: 0.009 }],
      anchor_marginal: [{ gene: 'IGHJ2', genotype: 0, box }],
      partner_marginal: [{ gene: 'IGHD1', genotype: 0, box }],
      usage: { IGHJ2: { significant: true, p_value: 0.001 }, IGHD1: { significant: true, p_value: 0.0001 } },
      thresholds: [{ analysis: 'usage', threshold: 0.00001 }],
    }));
    TestBed.configureTestingModule({ providers: [{ provide: QtlService, useValue: api }] });
    component = new QtlPairingComponent(TestBed.inject(QtlService));
    component.species = 'Human';
    component.locus = 'IGH';
    component.variant = 'v1';
    component.ngOnChanges({ variant: new SimpleChange(null, 'v1', true) });
  });

  it('chooses the strongest anchor and builds aligned plots and export rows', () => {
    expect(api.pairing).toHaveBeenCalledWith('Human', 'IGH', 'v1', 'P(J|D)');
    expect(component.chosen).toEqual(['IGHJ2']);
    expect(component.anchorsWithSignal).toBe(1);
    expect(component.partnersMovedInUsage).toBe(1);
    expect(component.usageThresholdText).toBe('p ≤ 1.00e-5');
    expect(component.rows[0].gridData).toHaveLength(3);
    expect(component.rows[0].marginalData).toHaveLength(4);
    expect(component.partnerData).toHaveLength(4);
    expect(component.anchorTable('IGHJ2').rows[0]).toEqual([
      'J2', 'D1', '0/0', 10, 0, 0.1, 0.2, 0.3, 0.4, 0.2, 'yes', 'no', 0.009, 0.001, 'yes', 10,
    ]);
    component.toggleStrict();
    expect(component.rows[0].gridData).toHaveLength(4);
    expect(component.rows[0].gridData[3]).toMatchObject({ text: ['**'], x: ['D1'] });
  });

  it('limits selected anchors, maintains scan order and refetches on direction change', () => {
    component.toggleAnchor('IGHJ4');
    component.toggleAnchor('IGHJ1');
    component.toggleAnchor('IGHJ3');
    expect(component.chosen).toEqual(['IGHJ1', 'IGHJ2', 'IGHJ4']);
    expect(component.atAnchorLimit).toBe(true);
    component.toggleAnchor('IGHJ2');
    expect(component.chosen).toEqual(['IGHJ1', 'IGHJ4']);
    expect(component.short('IGHD2-2/IGHD2-8')).toBe('D2-2/D2-8');
    component.conditional = 'P(D|J)';
    component.ngOnChanges({ conditional: new SimpleChange('P(J|D)', 'P(D|J)', false) });
    expect(api.pairing).toHaveBeenLastCalledWith('Human', 'IGH', 'v1', 'P(D|J)');
    expect(component.anchorSide).toBe('D');
    expect(component.partnerSide).toBe('J');
  });

  it('reports a failed scan and clears previous data', () => {
    api.pairing.mockReturnValue(throwError(() => ({ error: { message: 'unavailable' } })));
    component.ngOnChanges({ variant: new SimpleChange('v1', 'v2', false) });
    expect(component.error).toBe('unavailable');
    expect(component.loading).toBe(false);
    expect(component.rows).toEqual([]);
  });

  it('configures exports and toggles marginal plots while retaining ranked tests', () => {
    expect(component.isChosen('IGHJ2')).toBe(true);
    expect(component.omnibusRows.map(row => row.anchor)).toEqual(['IGHJ2', 'IGHJ1']);
    expect(component.omnibusOf('unknown')).toBeNull();
    expect(component.usageOf('IGHD1')).toMatchObject({ significant: true });
    expect(component.gridConfig('IGHJ2').modeBarButtonsToAdd).toBeDefined();
    expect(component.marginalConfig('IGHJ2').modeBarButtonsToAdd).toBeDefined();
    const anchorBefore = component.showAnchorMarginal;
    const partnerBefore = component.showPartnerMarginal;
    component.toggleAnchorMarginal();
    component.togglePartnerMarginal();
    component.toggleInfo();
    component.toggleTestInfo();
    expect(component.showAnchorMarginal).toBe(!anchorBefore);
    expect(component.showPartnerMarginal).toBe(!partnerBefore);
    expect(component.infoOpen).toBe(true);
    expect(component.testInfoOpen).toBe(true);
  });

  it('handles a sparse scan with missing boxes, test statistics and annotations', () => {
    api.pairing.mockReturnValue(of({
      anchors: ['IGHJ1'], partners: ['IGHD1'], marks: [{ anchor: 'IGHJ1', partner: 'IGHD1', marked: true }],
    }));
    component.ngOnChanges({ variant: new SimpleChange('v1', 'v2', false) });
    expect(component.chosen).toEqual(['IGHJ1']);
    expect(component.omnibusRows).toEqual([]);
    expect(component.usageOf('IGHD1')).toBeNull();
    expect(component.anchorTable('IGHJ1').rows[0]).toEqual([
      'J1', 'D1', '0/0', '', '', '', '', '', '', '', 'yes', 'no', '', '', 'no', '',
    ]);
    expect(component.rows[0].gridData).toHaveLength(3);
    component.toggleStrict();
    expect(component.rows[0].gridData).toHaveLength(4);
    expect(component.rows[0].marginalData).toHaveLength(3);
    component.togglePartnerMarginal();
    expect(component.rows[0].gridLayout).toMatchObject({ xaxis: { showticklabels: true } });
  });
});
