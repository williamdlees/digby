import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_PATH } from '../variables';
import { RefbookService } from './refbook.service';

describe('refbook API client', () => {
  let service: RefbookService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), RefbookService,
      { provide: BASE_PATH, useValue: 'https://example.test/api' },
    ] });
    service = TestBed.inject(RefbookService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('encodes alignment selection and requested filters', () => {
    service.getAscAlignment('Rhesus Macaque', 'IGH', 'V1/2', 10, 'genomic', 'A,B').subscribe();
    const request = http.expectOne(req => req.url === 'https://example.test/api/refbook/asc_alignment/Rhesus%20Macaque/IGH/V1%2F2');
    expect(request.request.params.get('wrap')).toBe('10');
    expect(request.request.params.get('sources')).toBe('genomic');
    expect(request.request.params.get('alleles')).toBe('A,B');
    expect(request.request.headers.get('Accept')).toBe('application/json');
    request.flush({ alignment: '' });
  });

  it('sends source, project and sample filters to overview and zygosity', () => {
    service.getAscsOverview('Human', 'IGH', 'V1', 'genomic', 'A', 'P', 'S').subscribe();
    let request = http.expectOne(req => req.url.endsWith('/refbook/ascs_overview/Human/IGH/V1'));
    expect(request.request.params.keys()).toEqual(['sources', 'alleles', 'projects', 'samples']);
    expect(request.request.params.get('samples')).toBe('S');
    request.flush({});
    service.getAscZygosity('Human', 'IGH', 'V1', 'P', 'S', 'A', 'airrseq').subscribe();
    request = http.expectOne(req => req.url.endsWith('/refbook/asc_zygousity/Human/IGH/V1'));
    expect(request.request.params.get('sources')).toBe('airrseq');
    expect(request.request.params.get('projects')).toBe('P');
    expect(request.request.params.get('samples')).toBe('S');
    expect(request.request.params.get('alleles')).toBe('A');
    request.flush({});
  });

  it('requests species, genes, sequences, usage, projects and samples from their endpoints', () => {
    service.getSpeciesApi().subscribe();
    service.getAscsInLocusApi('Human', 'IGH').subscribe();
    service.getAscSeqs('Human', 'IGH', 'V1').subscribe();
    service.getAscUsage('Human', 'IGH', 'V1', 'P', 'S', 'A').subscribe();
    service.getProjects('Human', 'IGH', 'genomic').subscribe();
    service.getSamples('Human', 'IGH', 'P', 'genomic').subscribe();
    for (const path of ['species_and_loci', 'ascs_in_locus/Human/IGH', 'asc_seqs/Human/IGH/V1',
      'asc_usage/Human/IGH/V1', 'projects/Human/IGH', 'samples/Human/IGH']) {
      const request = http.expectOne(req => req.url.endsWith(`/refbook/${path}`));
      expect(request.request.method).toBe('GET');
      if (path.startsWith('asc_usage')) {
        expect(request.request.params.get('projects')).toBe('P');
        expect(request.request.params.get('samples')).toBe('S');
        expect(request.request.params.get('alleles')).toBe('A');
      }
      if (path.startsWith('samples/')) {
        expect(request.request.params.get('sources')).toBe('genomic');
        expect(request.request.params.get('projects')).toBe('P');
      }
      request.flush({});
    }
  });

  it('rejects missing required alignment, usage and sequence identifiers', () => {
    expect(() => service.getAscAlignment(null, 'IGH', 'V1')).toThrow('Required parameter species');
    expect(() => service.getAscUsage('Human', null, 'V1')).toThrow('Required parameter locus');
    expect(() => service.getAscSeqs('Human', 'IGH', null)).toThrow('Required parameter asc');
    expect(() => service.getAscsOverview('Human', null, 'V1')).toThrow('Required parameter chain');
  });
});
