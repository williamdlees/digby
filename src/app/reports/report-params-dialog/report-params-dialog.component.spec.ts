import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReportParamsDialogComponent } from './report-params-dialog.component';

describe('report parameter dialog', () => {
  it('uses valid initial values, defaults invalid choices, and submits scoped parameters', () => {
    const activeModal = new NgbActiveModal();
    vi.spyOn(activeModal, 'close');
    const component = new ReportParamsDialogComponent(activeModal, {} as NgbModal);
    component.report = { scope: ['gen_sample', 'rep_sample'], filter_params: true, params: [
      { id: 'sort', type: 'select', options: ['Locus', 'Gene'] },
      { id: 'name', type: 'text' },
    ] };
    component.filterParams = [{ id: 'format', type: 'select', options: ['csv', 'tsv'] }];
    component.initialValues = { sort: 'bad', name: 'IGHV1', format: 'tsv' };
    component.sampleCoverage = { genomic: ['g1', 'g2'], genomicScope: 'selected',
      AIRRSeq: ['r1'], AIRRSeqScope: 'all' };
    component.ngOnInit();
    expect(component.scopeText).toBe('The report will be run on selected samples from g1, g2 genomic datasets and all samples from the r1 AIRR-Seq dataset');
    component.onSubmit();
    expect(activeModal.close).toHaveBeenCalledWith({ sort: 'Locus', name: 'IGHV1', format: 'tsv' });
  });

  it('initializes empty parameters and describes one genomic dataset', () => {
    const activeModal = new NgbActiveModal();
    vi.spyOn(activeModal, 'close');
    const component = new ReportParamsDialogComponent(activeModal, {} as NgbModal);
    component.report = { scope: ['gen_sample'], filter_params: false, params: [
      { id: 'name', type: 'text' }, { id: 'choice', type: 'select', options: [] },
    ] };
    component.sampleCoverage = { genomic: ['g1'], genomicScope: 'all', AIRRSeq: [], AIRRSeqScope: 'all' };
    component.ngOnInit();
    expect(component.scopeText).toBe('The report will be run on all samples from the g1 genomic dataset');
    component.onSubmit();
    expect(activeModal.close).toHaveBeenCalledWith({ name: '', choice: '' });
  });

  it('describes multiple AIRR-seq datasets and preserves valid choices', () => {
    const activeModal = new NgbActiveModal();
    vi.spyOn(activeModal, 'close');
    const component = new ReportParamsDialogComponent(activeModal, {} as NgbModal);
    component.report = { scope: ['rep_sample'], filter_params: false, params: [
      { id: 'format', type: 'select', options: ['csv', 'tsv'] },
    ] };
    component.sampleCoverage = { genomic: [], genomicScope: 'all', AIRRSeq: ['r1', 'r2'], AIRRSeqScope: 'selected' };
    component.initialValues = { format: 'tsv' };
    component.ngOnInit();
    expect(component.scopeText).toBe('The report will be run on selected samples from r1, r2 AIRR-Seq datasets');
    component.onSubmit();
    expect(activeModal.close).toHaveBeenCalledWith({ format: 'tsv' });
  });
});
