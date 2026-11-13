import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Configuration } from '../configuration';
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

  it('rejects each missing required identifier before making a request', () => {
    const endpoints = [
      { name: 'getAscAlignment', fields: ['species', 'locus', 'asc'], call: (a: string, b: string, c: string) => service.getAscAlignment(a, b, c) },
      { name: 'getAscSeqs', fields: ['species', 'locus', 'asc'], call: (a: string, b: string, c: string) => service.getAscSeqs(a, b, c) },
      { name: 'getAscUsage', fields: ['species', 'locus', 'asc'], call: (a: string, b: string, c: string) => service.getAscUsage(a, b, c) },
      { name: 'getAscZygosity', fields: ['species', 'locus', 'asc'], call: (a: string, b: string, c: string) => service.getAscZygosity(a, b, c) },
      { name: 'getAscsOverview', fields: ['species', 'chain', 'asc'], call: (a: string, b: string, c: string) => service.getAscsOverview(a, b, c) },
      { name: 'getAscsInLocusApi', fields: ['species', 'locus'], call: (a: string, b: string) => service.getAscsInLocusApi(a, b) },
    ];

    for (const endpoint of endpoints) {
      for (const [index, field] of endpoint.fields.entries()) {
        for (const missing of [null, undefined]) {
          const args = ['Human', 'IGH', 'V1'];
          args[index] = missing;
          expect(() => endpoint.call(args[0], args[1], args[2]))
            .toThrow(`Required parameter ${field} was null or undefined when calling ${endpoint.name}.`);
        }
      }
    }
    http.expectNone(() => true);
  });

  it.each([null, undefined])('omits optional filters when they are %s', missing => {
    service.getProjects('Human', 'IGH', missing).subscribe();
    service.getSamples('Human', 'IGH', missing, missing).subscribe();
    service.getAscAlignment('Human', 'IGH', 'V1', missing, missing, missing).subscribe();
    service.getAscUsage('Human', 'IGH', 'V1', missing, missing, missing).subscribe();
    service.getAscZygosity('Human', 'IGH', 'V1', missing, missing, missing, missing).subscribe();
    service.getAscsOverview('Human', 'IGH', 'V1', missing, missing, missing, missing).subscribe();

    for (const path of ['projects/Human/IGH', 'samples/Human/IGH', 'asc_alignment/Human/IGH/V1',
      'asc_usage/Human/IGH/V1', 'asc_zygousity/Human/IGH/V1', 'ascs_overview/Human/IGH/V1']) {
      const request = http.expectOne(req => req.url.endsWith(`/refbook/${path}`));
      expect(request.request.params.keys()).toEqual([]);
      request.flush({});
    }
  });

  it('preserves zero, empty and encoded filter values independently', () => {
    service.getAscAlignment('Human', 'IGH', 'V1', 0, '', 'A+B').subscribe();
    let request = http.expectOne(req => req.url.endsWith('/refbook/asc_alignment/Human/IGH/V1'));
    expect(request.request.params.get('wrap')).toBe('0');
    expect(request.request.params.get('sources')).toBe('');
    expect(request.request.urlWithParams).toContain('alleles=A%2BB');
    request.flush({});

    service.getSamples('Human', 'IGH', undefined, 'airrseq').subscribe();
    request = http.expectOne(req => req.url.endsWith('/refbook/samples/Human/IGH'));
    expect(request.request.params.keys()).toEqual(['sources']);
    expect(request.request.params.get('sources')).toBe('airrseq');
    request.flush({});

    service.getAscsOverview('Human', 'IGH', 'V1', undefined, 'A', undefined, 'S').subscribe();
    request = http.expectOne(req => req.url.endsWith('/refbook/ascs_overview/Human/IGH/V1'));
    expect(request.request.params.keys()).toEqual(['alleles', 'samples']);
    expect(request.request.params.get('alleles')).toBe('A');
    expect(request.request.params.get('samples')).toBe('S');
    request.flush({});
  });

  it('encodes project and sample selection without losing reserved characters', () => {
    service.getProjects('Homo sapiens', 'IG/H', 'genomic+airrseq').subscribe();
    let request = http.expectOne(req =>
      req.url === 'https://example.test/api/refbook/projects/Homo%20sapiens/IG%2FH');
    expect(request.request.urlWithParams).toContain('sources=genomic%2Bairrseq');
    request.flush([]);

    service.getSamples('Homo sapiens', 'IG/H', 'study+control&replicate', 'airrseq').subscribe();
    request = http.expectOne(req =>
      req.url === 'https://example.test/api/refbook/samples/Homo%20sapiens/IG%2FH');
    const query = new URLSearchParams(request.request.urlWithParams.split('?')[1]);
    expect(query.get('projects')).toBe('study+control&replicate');
    expect(query.get('sources')).toBe('airrseq');
    expect([...query.keys()]).toEqual(['projects', 'sources']);
    request.flush([]);
  });

  it('sends independent filters for usage and zygosity', () => {
    service.getAscUsage('Human', 'IGH', 'V1', undefined, 'sample-1', undefined).subscribe();
    let request = http.expectOne(req => req.url.endsWith('/refbook/asc_usage/Human/IGH/V1'));
    expect(request.request.params.keys()).toEqual(['samples']);
    expect(request.request.params.get('samples')).toBe('sample-1');
    request.flush({});

    service.getAscZygosity('Human', 'IGH', 'V1', null, undefined, 'V1*01', 'genomic').subscribe();
    request = http.expectOne(req => req.url.endsWith('/refbook/asc_zygousity/Human/IGH/V1'));
    expect(request.request.params.keys()).toEqual(['alleles', 'sources']);
    expect(request.request.params.get('alleles')).toBe('V1*01');
    expect(request.request.params.get('sources')).toBe('genomic');
    request.flush({});
  });

  it('honors configured headers, credentials, progress and response observation', () => {
    service.configuration.withCredentials = true;
    service.defaultHeaders = new HttpHeaders({ 'X-Client': 'refbook', Accept: 'text/plain' });
    let response: HttpResponse<unknown>;
    service.getAscAlignment('Human', 'IGH', 'V1', undefined, undefined, undefined, 'response', true)
      .subscribe(value => response = value);
    const request = http.expectOne(req => req.url.endsWith('/refbook/asc_alignment/Human/IGH/V1'));
    expect(request.request.headers.get('X-Client')).toBe('refbook');
    expect(request.request.headers.get('Accept')).toBe('application/json');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.reportProgress).toBe(true);
    request.flush({ alignment: 'ACGT' }, { status: 206, statusText: 'Partial Content' });
    expect(response.status).toBe(206);
    expect(response.body).toEqual({ alignment: 'ACGT' });
    expect(service.defaultHeaders.get('Accept')).toBe('text/plain');
  });

  it('retains default headers when configuration cannot select an Accept type', () => {
    vi.spyOn(service.configuration, 'selectHeaderAccept').mockReturnValue(undefined);
    service.defaultHeaders = new HttpHeaders({ 'X-Client': 'refbook' });
    service.getProjects('Human', 'IGH').subscribe();
    service.getSamples('Human', 'IGH').subscribe();
    service.getAscAlignment('Human', 'IGH', 'V1').subscribe();
    service.getAscSeqs('Human', 'IGH', 'V1').subscribe();
    service.getAscUsage('Human', 'IGH', 'V1').subscribe();
    service.getAscZygosity('Human', 'IGH', 'V1').subscribe();
    service.getAscsInLocusApi('Human', 'IGH').subscribe();
    service.getAscsOverview('Human', 'IGH', 'V1').subscribe();
    service.getSpeciesApi().subscribe();
    const requests = http.match(() => true);
    expect(requests).toHaveLength(9);
    for (const request of requests) {
      expect(request.request.headers.has('Accept')).toBe(false);
      expect(request.request.headers.get('X-Client')).toBe('refbook');
      request.flush({});
    }
  });

  it('uses the configuration base path when no injected path is provided', () => {
    const configured = new RefbookService(TestBed.inject(HttpClient), null,
      new Configuration({ basePath: 'https://other.test/api', withCredentials: true }));
    configured.getSpeciesApi().subscribe();
    const request = http.expectOne('https://other.test/api/refbook/species_and_loci');
    expect(request.request.withCredentials).toBe(true);
    request.flush({});
  });

  it('propagates server errors from a filtered request', () => {
    let error: HttpErrorResponse;
    service.getAscUsage('Human', 'IGH', 'V1', 'project-1')
      .subscribe({ error: (value: HttpErrorResponse) => error = value });
    const request = http.expectOne(req => req.url.endsWith('/refbook/asc_usage/Human/IGH/V1'));
    expect(request.request.params.get('projects')).toBe('project-1');
    request.flush({ message: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    expect(error.status).toBe(503);
    expect(error.error).toEqual({ message: 'Unavailable' });
  });

  it('propagates network failures while loading samples', () => {
    let error: HttpErrorResponse;
    service.getSamples('Human', 'IGH', 'project-1')
      .subscribe({ error: (value: HttpErrorResponse) => error = value });
    const request = http.expectOne(req => req.url.endsWith('/refbook/samples/Human/IGH'));
    expect(request.request.params.get('projects')).toBe('project-1');
    const networkError = new ProgressEvent('error');
    request.error(networkError);
    expect(error.status).toBe(0);
    expect(error.error).toBe(networkError);
  });
});
