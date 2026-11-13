import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable } from '@angular/material/table';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GenomicService, RepseqService } from 'projects/digby-swagger-client';
import { of } from 'rxjs';
import { GeneTableSelectorService } from '../gene-table-selector/gene-table-selector.service';
import { GenGeneSelectedService } from '../gen-gene-table/gen-gene-selected.service';
import { GenGeneTablePanelComponent } from '../gen-gene-table/gen-gene-table-panel/gen-gene-table-panel.component';
import { GenSampleFilterService } from '../gen-sample/gen-sample-filter.service';
import { GenSampleSelectedService } from '../gen-sample/gen-sample-selected.service';
import { GenSamplePanelComponent } from '../gen-sample/gen-sample-panel/gen-sample-panel.component';
import { RepGeneSelectedService } from '../rep-gene-table/rep-gene-selected.service';
import { RepGeneTablePanelComponent } from '../rep-gene-table/rep-gene-table-panel/rep-gene-table-panel.component';
import { RepSampleFilterService } from '../rep-sample/rep-sample-filter.service';
import { RepSampleSelectedService } from '../rep-sample/rep-sample-selected.service';
import { RepSamplePanelComponent } from '../rep-sample/rep-sample-panel/rep-sample-panel.component';
import { ReportRunService } from '../reports/report-run.service';

describe('gene and sample table interactions', () => {
  const genomic = { getSubjectsApi: vi.fn(), getSequencesApi: vi.fn() };
  const repseq = { getSamplesApi: vi.fn(), getSequencesApi: vi.fn() };
  const reports = { runReport: vi.fn() };
  const modal = { open: vi.fn() };
  let selector: GeneTableSelectorService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    genomic.getSubjectsApi.mockReturnValue(of({ total_items: 0, uniques: {}, samples: [] }));
    genomic.getSequencesApi.mockReturnValue(of({ total_items: 0, uniques: {}, sequences: [] }));
    repseq.getSamplesApi.mockReturnValue(of({ total_items: 0, uniques: {}, samples: [] }));
    repseq.getSequencesApi.mockReturnValue(of({ total_items: 0, uniques: {}, samples: [] }));
    TestBed.overrideComponent(MatTable, { set: { template: '' } });
    TestBed.configureTestingModule({ providers: [
      GeneTableSelectorService, GenGeneSelectedService, RepGeneSelectedService,
      GenSampleSelectedService, RepSampleSelectedService, GenSampleFilterService, RepSampleFilterService,
      { provide: GenomicService, useValue: genomic }, { provide: RepseqService, useValue: repseq },
      { provide: ReportRunService, useValue: reports }, { provide: NgbModal, useValue: modal },
      { provide: Router, useValue: { navigate: vi.fn() } },
      { provide: ActivatedRoute, useValue: { params: of({}), queryParamMap: of(convertToParamMap({})) } },
    ] });
    selector = TestBed.inject(GeneTableSelectorService);
    selector.selection.next({ ...selector.selection.value, datasets: ['gen'], repSeqs: ['rep'] });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  function paginator() {
    const paginator = TestBed.createComponent(MatPaginator).componentInstance;
    paginator.pageSize = 20;
    paginator.pageIndex = 2;
    return paginator;
  }

  it('filters genomic samples and sends current filters to downloads', () => {
    const component = new GenSamplePanelComponent(
      TestBed.inject(GenomicService), selector, TestBed.inject(NgbModal), TestBed.inject(GenGeneSelectedService),
      TestBed.inject(GenSampleSelectedService), TestBed.inject(GenSampleFilterService), TestBed.inject(ReportRunService),
    );
    component.ngOnInit();
    component.selection = selector.selection.value;
    component.paginator = paginator();
    component.searchBox = new ElementRef(document.createElement('input'));
    const sort = { field: 'sex', order: 'asc' };
    component.applyFilter({
      field: 'sex', predicates: [{ field: 'sex', op: 'in', value: ['female'] }], sort,
    });
    expect(component.paginator.pageIndex).toBe(0);
    expect(genomic.getSubjectsApi).toHaveBeenLastCalledWith('Human', 'gen', 0, 20,
      '[{"field":"sex","op":"in","value":["female"]}]', '[{"field":"sex","order":"asc"}]',
      JSON.stringify(component.displayedColumns));
    component.sendReportRequest('download_gen_data', 'csv', {});
    expect(reports.runReport).toHaveBeenCalledWith(
      { name: 'download_gen_data', title: 'Download', filter_params: [] }, 'csv', 'Human',
      ['gen'], component.filters, [], [], { filters: component.filters },
    );
    component.clearSelection();
    expect(TestBed.inject(GenSampleFilterService).selection.value.filters).toEqual([]);
  });

  it('filters repertoire samples by selected genes and prepares genotype reports', () => {
    const component = new RepSamplePanelComponent(
      TestBed.inject(RepseqService), selector, TestBed.inject(NgbModal), TestBed.inject(RepGeneSelectedService),
      TestBed.inject(RepSampleSelectedService), TestBed.inject(RepSampleFilterService),
      TestBed.inject(ReportRunService), TestBed.inject(Router), new ElementRef(document.createElement('div')),
    );
    component.ngOnInit();
    component.selection = selector.selection.value;
    component.paginator = paginator();
    component.searchBox = new ElementRef(document.createElement('input'));
    component.selectedSequenceNames = ['A', 'B'];
    component.isSelectedSamplesChecked = true;
    component.onSelectedSamplesChange();
    expect(component.filters).toEqual([{ field: 'allele', op: 'in', value: ['A', 'B'] }]);
    expect(repseq.getSamplesApi).toHaveBeenLastCalledWith('Human', 'rep', 0, 20,
      '[{"field":"allele","op":"in","value":["A","B"]}]', '[]', JSON.stringify(component.displayedColumns));
    component.sendReportRequest('rep_single_genotype', 'html',
      JSON.stringify({ name: 'sample1', sort_order: 'Gene', repSeqs: ['rep'] }));
    expect(reports.runReport).toHaveBeenCalledWith(
      { name: 'rep_single_genotype', title: 'Genotype Report', filter_params: [] }, 'html', 'Human',
      [], [], ['rep'], [{ field: 'sample_name', op: 'in', value: ['sample1'] }], { sort_order: 'Gene' },
    );
  });

  it('loads genomic genes with filters and opens sequence details', () => {
    const component = new GenGeneTablePanelComponent(
      TestBed.inject(GenomicService), selector, TestBed.inject(NgbModal), TestBed.inject(GenGeneSelectedService),
      TestBed.inject(GenSampleSelectedService), TestBed.inject(Router), TestBed.inject(ReportRunService), TestBed.inject(ActivatedRoute),
    );
    component.ngOnInit();
    component.selection = selector.selection.value;
    component.paginator = paginator();
    component.searchBox = new ElementRef(document.createElement('input'));
    const sort = { field: 'name', order: 'asc' };
    component.applyFilter({
      field: 'name', predicates: [{ field: 'name', op: 'in', value: ['IGH'] }], sort,
    });
    component.loadSequencesPage();
    expect(genomic.getSequencesApi).toHaveBeenLastCalledWith('Human', 'gen', 0, 20,
      '[{"field":"name","op":"in","value":["IGH"]}]', '[{"field":"name","order":"asc"}]',
      JSON.stringify(component.displayedColumns));
    const dialog = { componentInstance: {} };
    modal.open.mockReturnValue(dialog);
    component.onSequenceClick({ name: 'gene', sequence: 'AC', gapped_sequence: 'A.C' });
    expect(dialog.componentInstance).toMatchObject({ name: 'gene', content: { ungapped: 'AC', gapped: 'A.C' } });
  });

  it('loads repertoire genes and removes alignment gaps in sequence details', () => {
    const component = new RepGeneTablePanelComponent(
      TestBed.inject(RepseqService), selector, TestBed.inject(NgbModal), TestBed.inject(RepGeneSelectedService),
      TestBed.inject(RepSampleSelectedService), TestBed.inject(Router), TestBed.inject(ReportRunService), TestBed.inject(ActivatedRoute),
    );
    component.ngOnInit();
    component.selection = selector.selection.value;
    component.paginator = paginator();
    component.searchBox = new ElementRef(document.createElement('input'));
    component.isSelectedGenesChecked = true;
    component.samplesSelected = true;
    component.selectedSampleIds = ['sample1'];
    component.onSelectedIdsChange();
    component.loadSequencesPage();
    expect(repseq.getSequencesApi).toHaveBeenLastCalledWith('Human', 'rep', 0, 20,
      '[{"field":"sample_id","op":"in","value":["sample1"]}]', '[]', JSON.stringify(component.displayedColumns));
    const dialog = { componentInstance: {} };
    modal.open.mockReturnValue(dialog);
    component.onSequenceClick({ name: 'gene', seq: 'A.C' });
    expect(dialog.componentInstance).toMatchObject({ name: 'gene', content: { ungapped: 'AC', gapped: 'A.C' } });
  });

  it('updates both gene tables when selected samples, columns and search change', () => {
    const components = [
      new GenGeneTablePanelComponent(TestBed.inject(GenomicService), selector, TestBed.inject(NgbModal),
        TestBed.inject(GenGeneSelectedService), TestBed.inject(GenSampleSelectedService), TestBed.inject(Router),
        TestBed.inject(ReportRunService), TestBed.inject(ActivatedRoute)),
      new RepGeneTablePanelComponent(TestBed.inject(RepseqService), selector, TestBed.inject(NgbModal),
        TestBed.inject(RepGeneSelectedService), TestBed.inject(RepSampleSelectedService), TestBed.inject(Router),
        TestBed.inject(ReportRunService), TestBed.inject(ActivatedRoute)),
    ];
    for (const [index, component] of components.entries()) {
      component.ngOnInit();
      component.paginator = paginator();
      component.searchBox = new ElementRef(document.createElement('input'));
      component.ngAfterViewInit();
      vi.advanceTimersByTime(1100);
      component.isSelectedGenesChecked = true;
      const selected = index === 0 ? TestBed.inject(GenSampleSelectedService) : TestBed.inject(RepSampleSelectedService);
      selected.selection.next({ ids: ['sample1'] });
      expect(component.filters).toContainEqual({ field: 'sample_id', op: 'in', value: ['sample1'] });
      selected.selection.next({ ids: [] });
      expect(component.isSelectedGenesChecked).toBe(false);
      expect(component.filters).not.toContainEqual({ field: 'sample_id', op: 'in', value: ['sample1'] });

      component.filters = [{ field: 'removed', op: 'in', value: ['x'] }];
      component.sorts = [{ field: 'removed', order: 'asc' }];
      component.lastLoadedColumns = ['removed', 'name'];
      component.displayedColumns = ['name'];
      component.updateColumnData(null);
      expect(component.filters).toEqual([]);
      expect(component.sorts).toEqual([]);
      component.searchBox.nativeElement.value = 'IGH';
      component.searchBox.nativeElement.dispatchEvent(new Event('keyup'));
      vi.advanceTimersByTime(1000);
      expect(component.setFilterSubject.value.op1).toBe('IGH');
      component.onAppearancesClick({ name: 'IGHV1' });
      expect(component.setFilterSubject.value.op1).toBe('IGHV1');
      component.clearSelection();
      expect(component.searchBox.nativeElement.value).toBe('');
      component.ngOnDestroy();
    }
  });

  it('keeps sample tables synchronized with selected genes and opens sample details', () => {
    const components = [
      new GenSamplePanelComponent(TestBed.inject(GenomicService), selector, TestBed.inject(NgbModal),
        TestBed.inject(GenGeneSelectedService), TestBed.inject(GenSampleSelectedService),
        TestBed.inject(GenSampleFilterService), TestBed.inject(ReportRunService)),
      new RepSamplePanelComponent(TestBed.inject(RepseqService), selector, TestBed.inject(NgbModal),
        TestBed.inject(RepGeneSelectedService), TestBed.inject(RepSampleSelectedService),
        TestBed.inject(RepSampleFilterService), TestBed.inject(ReportRunService), TestBed.inject(Router),
        new ElementRef(document.createElement('div'))),
    ];
    for (const [index, component] of components.entries()) {
      component.ngOnInit();
      component.paginator = paginator();
      component.table = TestBed.createComponent(MatTable<string>).componentInstance;
      vi.spyOn(component.table, 'renderRows').mockImplementation(() => {});
      component.searchBox = new ElementRef(document.createElement('input'));
      component.ngAfterViewInit();
      vi.advanceTimersByTime(600);
      const selected = index === 0 ? TestBed.inject(GenGeneSelectedService) : TestBed.inject(RepGeneSelectedService);
      selected.selection.next({ names: ['IGHV1'], onlySelected: true });
      expect(component.filters).toContainEqual({ field: 'allele', op: 'in', value: ['IGHV1'] });
      selected.selection.next({ names: [], onlySelected: false });
      expect(component.isSelectedSamplesChecked).toBe(false);
      const dialog = { componentInstance: {} };
      modal.open.mockReturnValue(dialog);
      component.showInfo({ sample_name: 'sample1', dataset: 'study' });
      expect(dialog.componentInstance).toMatchObject({ sampleName: 'sample1', species: 'Human', dataset: 'study' });
      component.quickSearch('sample1');
      expect(component.setFilterSubject.value.op1).toBe('sample1');
      component.clearSelection();
      expect(component.filters).toEqual([]);
      component.ngOnDestroy();
    }
  });
});
