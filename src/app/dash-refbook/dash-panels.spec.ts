import { DASH_PANELS, panelBlockedReason } from './dash-panels';

describe('reference dashboard availability', () => {
  const usage = DASH_PANELS.find(panel => panel.id === 'usage');
  const allele = DASH_PANELS.find(panel => panel.id === 'allele');
  const sunburst = DASH_PANELS.find(panel => panel.id === 'sunburst');

  it('explains unavailable and unselected sources separately', () => {
    expect(panelBlockedReason(usage, [], { genomic: true, airrseq: false }, 1))
      .toBe('This locus has no AIRR-seq data.');
    expect(panelBlockedReason(usage, [], { genomic: true, airrseq: true }, 1))
      .toBe('Needs AIRR-seq data. Enable it in the rail.');
    expect(panelBlockedReason(usage, ['airrseq'], { genomic: true, airrseq: true }, 1)).toBeNull();
  });

  it('requires an allele for allele detail and a gene for single-gene views', () => {
    const available = { genomic: true, airrseq: true };
    expect(panelBlockedReason(allele, [], available, 1)).toBe('Pick an allele to open it here.');
    expect(panelBlockedReason(allele, [], available, 0, 1)).toBe('Select a gene to see this panel.');
    expect(panelBlockedReason(allele, [], available, 1, 1)).toBeNull();
    expect(panelBlockedReason(sunburst, [], available, 0)).toBeNull();
  });

  it('resolves every lazily loaded reference panel', async () => {
    const components = await Promise.all(DASH_PANELS.map(panel => panel.load()));
    expect(components).toEqual([
      (await import('./dash-refbook-allele/dash-refbook-allele.component')).DashRefbookAlleleComponent,
      (await import('./dash-refbook-overview/dash-refbook-overview.component')).DashRefbookOverviewComponent,
      (await import('./dash-refbook-sunburst/dash-refbook-sunburst.component')).DashRefbookSunburstComponent,
      (await import('./dash-refbook-names/dash-refbook-names.component')).DashRefbookNamesComponent,
      (await import('./dash-refbook-alignment/dash-refbook-alignment.component')).DashRefbookAlignmentComponent,
      (await import('./dash-refbook-tree/dash-refbook-tree.component')).DashRefbookTreeComponent,
      (await import('./dash-refbook-usage/dash-refbook-usage.component')).DashRefbookUsageComponent,
      (await import('./dash-refbook-zygosity/dash-refbook-zygosity.component')).DashRefbookZygosityComponent,
    ]);
  });
});
