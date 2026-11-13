import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SystemService } from 'projects/digby-swagger-client';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { WordpressService } from './wordpress.service';

describe('WordpressService', () => {
  let service: WordpressService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: SystemService, useValue: {} },
      { provide: AuthService, useValue: { sysConfig: new BehaviorSubject({
        wp_news_url: 'https://example.test/', wp_rest: 'wp-json/',
        vdjbase_news: 'https://example.test/posts?categories=7',
        vdjbase_help: 'https://example.test/posts?categories=9',
      }) } },
    ] });
    service = TestBed.inject(WordpressService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('retrieves and cleans a paginated, searchable feed', () => {
    expect(service.feedCategories()).toEqual({ news: '7', help: '9' });
    let result;
    service.fetchPosts('7,9', 'gene', 2, 10).subscribe(value => result = value);
    const request = http.expectOne(req => req.url === 'https://example.test/wp-json/posts');
    expect(request.request.params.toString()).toContain('categories=7,9');
    expect(request.request.params.get('search')).toBe('gene');
    expect(request.request.params.get('page')).toBe('2');
    request.flush([{ title: { rendered: 'Title' }, link: '/post', date: '2024', categories: [7],
      excerpt: { rendered: '<p>Text &amp; more <a class="more-link" href="/post">read more</a></p>' } }],
      { headers: { 'X-WP-TotalPages': '3' } });
    expect(result).toEqual({ totalPages: 3, posts: [{
      title: 'Title', link: '/post', date: '2024', categories: [7], excerpt: 'Text & more',
    }] });
  });

  it('combines topics for multiple feed categories', () => {
    let topics;
    service.fetchTopics(['7', '9']).subscribe(value => topics = value);
    const requests = http.match(req => req.url.endsWith('/categories'));
    expect(requests.map(req => req.request.params.get('parent'))).toEqual(['7', '9']);
    requests[0].flush([{ id: 8, name: 'News', parent: 7 }]);
    requests[1].flush([{ id: 10, name: 'Help', parent: 9 }]);
    expect(topics).toEqual([{ id: 8, name: 'News', parent: 7 }, { id: 10, name: 'Help', parent: 9 }]);
  });
});
