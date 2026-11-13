import { TestBed } from '@angular/core/testing';
import { RepseqService } from 'projects/digby-swagger-client';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { SysConfig } from '../auth/sysconfig.model';
import { GeneTableSelectorService } from '../gene-table-selector/gene-table-selector.service';
import { HomeComponent } from './home.component';
import { SiteSearchService } from './site-search.service';
import { WordpressService } from './wordpress.service';

describe('home page', () => {
  let config = new BehaviorSubject(new SysConfig(false, '', '', ''));
  const wordpress = { sysConfig: config, feedCategories: vi.fn(), fetchPosts: vi.fn(), fetchTopics: vi.fn() };
  const repseq = { getSpeciesApi: vi.fn(), getDataSetApi: vi.fn() };
  const search = { search: vi.fn() };
  let component: HomeComponent;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    config = new BehaviorSubject(new SysConfig(false, '', '', ''));
    wordpress.sysConfig = config;
    wordpress.feedCategories.mockReturnValue({ news: '1', help: '2' });
    wordpress.fetchPosts.mockReturnValue(of({ posts: [{ categories: [1, 3] }], totalPages: 2 }));
    wordpress.fetchTopics.mockReturnValue(of([{ id: 3, name: 'Research' }]));
    repseq.getSpeciesApi.mockReturnValue(of(['Human', 'Mouse']));
    repseq.getDataSetApi.mockReturnValue(of([{ dataset: 'IGH' }, { dataset: 'IGK' }]));
    search.search.mockReturnValue(of([{ title: 'Result' }]));
    TestBed.configureTestingModule({ providers: [
      GeneTableSelectorService, { provide: WordpressService, useValue: wordpress },
      { provide: AuthService, useValue: {} }, { provide: RepseqService, useValue: repseq },
      { provide: SiteSearchService, useValue: search },
    ] });
    component = new HomeComponent(TestBed.inject(WordpressService), TestBed.inject(AuthService),
      TestBed.inject(RepseqService), TestBed.inject(SiteSearchService), TestBed.inject(GeneTableSelectorService));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('initializes news topics and debounces filtered searches', () => {
    component.ngOnInit();
    config.next(new SysConfig(false, '', '', 'https://example.test'));
    expect(wordpress.fetchPosts).toHaveBeenCalledWith('1,2', '', 1);
    expect(component.topics.map(topic => topic.label)).toEqual(['All', 'News', 'Help', 'Research']);
    expect(component.postTopic(component.posts[0])).toBe('Research');
    component.goToPage(2);
    component.searchPosts(' allele ');
    vi.advanceTimersByTime(300);
    expect(wordpress.fetchPosts).toHaveBeenLastCalledWith('1,2', 'allele', 1);
    component.selectTopic('2');
    expect(wordpress.fetchPosts).toHaveBeenLastCalledWith('2', 'allele', 1);
  });

  it('distinguishes an empty results page from a server error', () => {
    wordpress.fetchPosts.mockReturnValueOnce(throwError(() => ({ status: 400 })))
      .mockReturnValueOnce(throwError(() => ({ status: 500 })));
    component.loadPosts();
    expect(component.posts).toEqual([]);
    expect(component.errorPosts).toBeNull();
    component.loadPosts();
    expect(component.errorPosts).toEqual({ status: 500 });
    expect(component.loadingPosts).toBe(false);
  });

  it('loads download choices once and searches using the selected species', () => {
    component.ngOnInit();
    component.openDownloads(true);
    component.openDownloads(true);
    expect(repseq.getSpeciesApi).toHaveBeenCalledOnce();
    expect(component.dlSpecies).toBe('Human');
    expect(component.dlDataset).toBe('IGH');
    component.selectDownloadSpecies('Mouse');
    expect(repseq.getDataSetApi).toHaveBeenLastCalledWith('Mouse');
    component.searchSite(' IGHV ');
    vi.advanceTimersByTime(300);
    expect(search.search).toHaveBeenCalledWith('IGHV', 'Human');
    expect(component.siteResults).toEqual([{ title: 'Result' }]);
    component.clearSiteSearch();
    vi.advanceTimersByTime(300);
    expect(search.search).toHaveBeenLastCalledWith('', 'Human');
  });
});
