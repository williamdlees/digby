import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RepseqService } from 'projects/digby-swagger-client';
import { DownloadsComponent } from './downloads.component';

describe('downloads selection', () => {
  const route = { queryParamMap: of(convertToParamMap({ species: 'Human', dataset: 'IGK' })) };
  const router = { navigate: vi.fn() };
  const api = { getSpeciesApi: vi.fn(), getDataSetApi: vi.fn(), getDataSetInfoApi: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    route.queryParamMap = of(convertToParamMap({ species: 'Human', dataset: 'IGK' }));
    api.getSpeciesApi.mockReturnValue(of(['Human']));
    api.getDataSetApi.mockReturnValue(of([{ dataset: 'IGH' }, { dataset: 'IGK' }]));
    api.getDataSetInfoApi.mockReturnValue(of({ studies: [{ study_name: 'P1' }] }));
    TestBed.configureTestingModule({ providers: [
      DownloadsComponent,
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: router },
      { provide: RepseqService, useValue: api },
    ] });
  });

  function component() {
    return TestBed.inject(DownloadsComponent);
  }

  it('loads the requested species and dataset and updates the URL on selection', () => {
    const downloads = component();
    downloads.ngOnInit();
    expect(api.getDataSetInfoApi).toHaveBeenCalledWith('Human', 'IGK');
    expect(downloads.studies).toEqual([{ study_name: 'P1' }]);
    expect(downloads.loading).toBe(false);
    downloads.select('Human', '');
    expect(router.navigate).toHaveBeenCalledWith([], { queryParams: { species: 'Human', dataset: null } });
  });

  it('surfaces dataset loading errors', () => {
    api.getDataSetApi.mockReturnValue(throwError(() => new Error('database unavailable')));
    const downloads = component();
    downloads.ngOnInit();
    expect(downloads.loading).toBe(false);
    expect(downloads.error).toBe('database unavailable');
    expect(api.getDataSetInfoApi).not.toHaveBeenCalled();
  });

  it('uses the first available species and dataset when the URL names are unavailable', () => {
    route.queryParamMap = of(convertToParamMap({ species: 'Other', dataset: 'missing' }));
    const downloads = component();
    downloads.ngOnInit();
    expect(downloads.species).toBe('Human');
    expect(downloads.dataset).toBe('IGH');
    expect(api.getDataSetInfoApi).toHaveBeenCalledWith('Human', 'IGH');
  });

  it('does not request studies when no species or datasets are available', () => {
    api.getSpeciesApi.mockReturnValueOnce(of([]));
    const downloads = component();
    downloads.ngOnInit();
    expect(downloads.species).toBe('');
    expect(api.getDataSetApi).not.toHaveBeenCalled();
    expect(api.getDataSetInfoApi).not.toHaveBeenCalled();
  });

  it('stops loading when a species has no datasets', () => {
    api.getDataSetApi.mockReturnValue(of([]));
    const downloads = component();
    downloads.ngOnInit();
    expect(downloads.dataset).toBe('');
    expect(downloads.loading).toBe(false);
    expect(api.getDataSetInfoApi).not.toHaveBeenCalled();
  });

  it('surfaces species and study request failures', () => {
    api.getSpeciesApi.mockReturnValueOnce(throwError(() => new Error('species unavailable')));
    const downloads = component();
    downloads.ngOnInit();
    expect(downloads.error).toBe('species unavailable');
    expect(api.getDataSetApi).not.toHaveBeenCalled();

    api.getDataSetInfoApi.mockReturnValueOnce(throwError(() => new Error('studies unavailable')));
    downloads.ngOnInit();
    expect(downloads.error).toBe('studies unavailable');
    expect(downloads.loading).toBe(false);
    expect(downloads.studies).toBeNull();
  });
});
