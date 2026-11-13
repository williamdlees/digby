import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QtlService } from '../qtl.service';
import { QtlSearchComponent } from './qtl-search.component';

describe('QTL search', () => {
  const api = { search: vi.fn() };
  let component: QtlSearchComponent;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: QtlService, useValue: api }] });
    component = new QtlSearchComponent(TestBed.inject(QtlService));
    component.species = 'Human';
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('debounces queries, formats both hit types and emits a selected variant', () => {
    api.search.mockReturnValue(of({
      genes: [{ locus: 'IGH', gene: 'IGHV1', asc: 'V1', n_significant: 2, n_variants: 10 }],
      variants: [{ locus: 'IGH', variant: 'v1', asc: 'V1', significant: true, neglog10_p: 5.26 }],
    }));
    component.query = ' v1 ';
    component.onType();
    vi.advanceTimersByTime(249);
    expect(api.search).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(api.search).toHaveBeenCalledWith('Human', 'v1', 'variant');
    expect(component.hits).toEqual([
      { kind: 'gene', locus: 'IGH', label: 'IGHV1', asc: 'V1', detail: '2 of 10 variants significant' },
      { kind: 'variant', locus: 'IGH', label: 'v1', variant: 'v1', asc: 'V1', detail: 'QTL for V1, -log10 p 5.3' },
    ]);
    const picked = vi.fn();
    component.variantPicked.subscribe(picked);
    component.choose(component.hits[1]);
    expect(picked).toHaveBeenCalledWith({ locus: 'IGH', variant: 'v1', asc: 'V1' });
    expect(component.query).toBe('');
    expect(component.hits).toEqual([]);
    expect(component.searched).toBe(false);
  });

  it('handles short queries and failed searches without leaving stale hits', () => {
    api.search.mockReturnValue(throwError(() => new Error('offline')));
    component.query = 'x';
    component.onType();
    vi.advanceTimersByTime(250);
    expect(api.search).not.toHaveBeenCalled();
    component.query = 'xyz';
    component.onType();
    vi.advanceTimersByTime(250);
    expect(component.hits).toEqual([]);
    expect(component.isSearching).toBe(false);
  });
});
