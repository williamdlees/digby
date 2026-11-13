import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { QtlService } from './qtl.service';

describe('QtlService', () => {
  let service: QtlService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), QtlService] });
    service = TestBed.inject(QtlService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('encodes path segments and includes the selected project and region parameters', () => {
    service.project = 'Study 1';
    service.region('Rhesus Macaque', 'IGH', 'chr1:123', 500, 'V1', { start: 5, end: 100 }).subscribe();
    const request = http.expectOne(req => req.url.endsWith('/qtl/region/Rhesus%20Macaque/IGH/chr1%3A123'));
    expect(request.request.params.get('project')).toBe('Study 1');
    expect(request.request.params.get('window')).toBe('500');
    expect(request.request.params.get('asc')).toBe('V1');
    expect(request.request.params.get('start')).toBe('5');
    expect(request.request.params.get('end')).toBe('100');
    request.flush({ variants: [] });
  });

  it('omits optional parameters when they are not selected', () => {
    service.search('Human', 'IGHV1').subscribe();
    const request = http.expectOne(req => req.url.endsWith('/qtl/search/Human'));
    expect(request.request.params.get('q')).toBe('IGHV1');
    expect(request.request.params.has('kind')).toBe(false);
    expect(request.request.params.has('project')).toBe(false);
    request.flush([]);
  });

  it('scopes scan, variant and summary requests to the current project', () => {
    service.project = 'Study 1';
    service.speciesAndLoci().subscribe();
    service.ascs('Human', 'IGH').subscribe();
    service.manhattan('Human', 'IGH', 'V1').subscribe();
    service.variant('Human', 'IGH', 'v1').subscribe();
    service.variantLookup('Human', 'v1').subscribe();
    service.pairingVariants('Human', 'IGH', 'P(J|D)', 25).subscribe();
    service.pairing('Human', 'IGH', 'v1', 'P(D|J)').subscribe();
    service.usageSummary('Human').subscribe();
    service.geneSummary('Human', 'IGH').subscribe();
    service.variantUsage('Human', 'IGH', 'v1', 'V1').subscribe();
    const catalogue = http.expectOne(req => req.url.endsWith('/qtl/species_and_loci'));
    expect(catalogue.request.params.has('project')).toBe(false);
    catalogue.flush({});
    for (const path of ['ascs/Human/IGH', 'manhattan/Human/IGH', 'variant/Human/IGH/v1',
      'variant_lookup/Human/v1', 'pairing_variants/Human/IGH', 'pairing/Human/IGH/v1',
      'usage_summary/Human', 'gene_summary/Human/IGH', 'variant_usage/Human/IGH/v1']) {
      const request = http.expectOne(req => req.url.endsWith(`/qtl/${path}`));
      expect(request.request.params.get('project')).toBe('Study 1');
      if (path.startsWith('pairing_variants/')) {
        expect(request.request.params.get('conditional')).toBe('P(J|D)');
        expect(request.request.params.get('limit')).toBe('25');
      }
      if (path.startsWith('variant_usage/') || path.startsWith('manhattan/')) {
        expect(request.request.params.get('asc')).toBe('V1');
      }
      request.flush({});
    }
  });
});
