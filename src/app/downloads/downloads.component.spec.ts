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
});
