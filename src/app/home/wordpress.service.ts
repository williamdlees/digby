// Collect recent posts from Wordpress

import {Injectable, OnInit} from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";
import {BehaviorSubject, forkJoin, Observable} from 'rxjs';
import {map} from "rxjs/operators";
import {retryWithBackoff} from "../shared/retry_with_backoff";
import { SystemService } from 'projects/digby-swagger-client';
import {SysConfig} from "../auth/sysconfig.model";
import {AuthService} from "../auth/auth.service";



@Injectable({
  providedIn: 'root'
})
export class WordpressService {
  private config = null;
  sysConfig = new BehaviorSubject<SysConfig>(new SysConfig(true, '', '', ''));

  constructor(private httpClient: HttpClient,
              private systemService: SystemService,
              private authService: AuthService) {

    this.init();
  }

  init() {
    this.authService.sysConfig
      .subscribe( sysConfig => {
      this.config = sysConfig;
      this.sysConfig.next(sysConfig);
    });
  }

  // The news and help feeds are WordPress categories; the config gives each feed as a posts URL with categories=<id>
  feedCategories(): { news: string, help: string } {
    const id = (url: string) => new URL(url).searchParams.get('categories');
    return { news: id(this.config.vdjbase_news), help: id(this.config.vdjbase_help) };
  }

  private restUrl(path: string): string {
    return `${this.config.wp_news_url}${this.config.wp_rest}${path}`;
  }

  // One page of posts in the given categories (comma-separated ids), optionally matching a search
  fetchPosts(categories: string, search: string, page: number, perPage = 6): Observable<PostPage> {
    let params = new HttpParams().set('categories', categories).set('per_page', perPage).set('page', page)
      .set('_fields', 'title,link,date,excerpt,categories');
    if (search) {
      params = params.set('search', search);
    }
    return this.httpClient.get<any[]>(this.restUrl('posts'), { params, observe: 'response' }).pipe(
      retryWithBackoff(),
      map(resp => ({
        totalPages: Number(resp.headers.get('X-WP-TotalPages')) || 1,
        posts: resp.body.map(item => ({
          title: item.title.rendered,
          link: item.link,
          date: item.date,
          excerpt: plainExcerpt(item.excerpt?.rendered),
          categories: item.categories,
        })),
      }))
    );
  }

  // Sub-categories of the feeds, so topics are managed in WordPress
  fetchTopics(parents: string[]): Observable<{ id: number, name: string, parent: number }[]> {
    const params = new HttpParams().set('per_page', 100).set('_fields', 'id,name,parent');
    return forkJoin(parents.map(parent =>
      this.httpClient.get<{ id: number, name: string, parent: number }[]>(this.restUrl('categories'), { params: params.set('parent', parent) })
    )).pipe(map(lists => lists.flat()));
  }
}

export interface Post { title: string, link: string, date: string, excerpt: string, categories: number[] }
export interface PostPage { posts: Post[], totalPages: number }

// WordPress excerpts are HTML ending in a "continue reading" link; keep the text only
function plainExcerpt(html: string): string {
  if (!html) {
    return '';
  }
  const doc = new DOMParser().parseFromString(html.replace(/<a class="more-link"[\s\S]*?<\/a>/, ''), 'text/html');
  return doc.body.textContent.trim();
}



