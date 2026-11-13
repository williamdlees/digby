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
});
