import {Component, OnInit, ViewChild} from '@angular/core';
import {Post, WordpressService} from "./wordpress.service";
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { SearchResult, SiteSearchService } from './site-search.service';
import { GeneTableSelectorService } from '../gene-table-selector/gene-table-selector.service';
import { DatePipe } from '@angular/common';
import {AuthService} from "../auth/auth.service";
import {SysConfig} from "../auth/sysconfig.model";

import { RouterLink } from '@angular/router';
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu } from '@ng-bootstrap/ng-bootstrap';
import { RepseqService } from 'projects/digby-swagger-client';
import { QUESTIONS, ENTRY_CARDS, CITATION, CONTRIBUTE, SEARCH_EXAMPLES } from './home-content';


@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [RouterLink, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, DatePipe]
})
export class HomeComponent implements OnInit {
  // news and documentation: one paged list over the WordPress feeds, filtered by topic and search
  topics: { label: string, categories: string }[] = [];
  topic = '';
  topicNames: Record<number, string> = {};
  search = '';
  private search$ = new Subject<string>();
  page = 1;
  totalPages = 1;
  posts: Post[] = [];
  loadingPosts = false;
  errorPosts = null;
  wpConfig = new SysConfig(true, '', '', '');
  questions = QUESTIONS;
  searchExamples = SEARCH_EXAMPLES;
  siteQuery = '';
  private siteQuery$ = new Subject<string>();
  siteResults: SearchResult[] = [];
  siteSearching = false;
  entryCards = ENTRY_CARDS;
  citation = CITATION;
  contribute = CONTRIBUTE;
  copied = '';
  dlSpeciesList: string[] = [];
  dlDatasets: string[] = [];
  dlSpecies = '';
  dlDataset = '';

  constructor( private wordpressService: WordpressService,
               private authService: AuthService,
               private repseqService: RepseqService,
               private siteSearch: SiteSearchService,
               private geneTableService: GeneTableSelectorService ) {  }

  searchSite(text: string) {
    this.siteQuery = text;
    this.siteQuery$.next(text.trim());
  }

  clearSiteSearch() {
    this.searchSite('');
  }

  // download picker: species and locus lists load the first time it opens
  openDownloads(open: boolean) {
    if (open && !this.dlSpeciesList.length) {
      this.repseqService.getSpeciesApi().subscribe((species: string[]) => {
        this.dlSpeciesList = species;
        this.selectDownloadSpecies(species[0]);
      });
    }
  }

  selectDownloadSpecies(species: string) {
    this.dlSpecies = species;
    this.dlDatasets = [];
    this.dlDataset = '';
    this.repseqService.getDataSetApi(species).subscribe((resp: { dataset: string }[]) => {
      this.dlDatasets = resp.map(d => d.dataset);
      this.dlDataset = this.dlDatasets[0] || '';
    });
  }

  loadPosts() {
    this.loadingPosts = true;
    this.errorPosts = null;
    this.wordpressService.fetchPosts(this.topic, this.search, this.page).subscribe({
      next: result => {
        this.posts = result.posts;
        this.totalPages = result.totalPages;
        this.loadingPosts = false;
      },
      error: error => {
        // WordPress answers a page past the end with an error; treat it as no results
        this.posts = [];
        this.totalPages = 1;
        this.errorPosts = error.status === 400 ? null : error;
        this.loadingPosts = false;
      }
    });
  }

  selectTopic(categories: string) {
    this.topic = categories;
    this.page = 1;
    this.loadPosts();
  }

  searchPosts(text: string) {
    this.search$.next(text.trim());
  }

  goToPage(page: number) {
    this.page = page;
    this.loadPosts();
  }

  private initPosts() {
    const feeds = this.wordpressService.feedCategories();
    this.topicNames = { [feeds.news]: 'News', [feeds.help]: 'Help' };
    this.topics = [
      { label: 'All', categories: `${feeds.news},${feeds.help}` },
      { label: 'News', categories: feeds.news },
      { label: 'Help', categories: feeds.help },
    ];
    this.topic = this.topics[0].categories;
    this.loadPosts();

    this.wordpressService.fetchTopics([feeds.news, feeds.help]).subscribe(subtopics => {
      for (const t of subtopics) {
        this.topicNames[t.id] = t.name;
        this.topics.push({ label: t.name, categories: String(t.id) });
      }
    });

    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(text => {
      this.search = text;
      this.page = 1;
      this.loadPosts();
    });
  }

  postTopic(post: Post): string {
    return post.categories.map(c => this.topicNames[c]).filter(Boolean).pop() || '';
  }

  copyCitation() {
    const c = this.citation;
    navigator.clipboard.writeText(`${c.authors} ${c.title} ${c.journal} ${c.doi}`)
      .then(() => this.copied = 'Copied', () => this.copied = 'Copy failed');
  }

  ngOnInit() {
    this.siteQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.siteSearching = true),
      switchMap(text => this.siteSearch.search(text, this.geneTableService.selection.value.species || 'Human')),
    ).subscribe(results => {
      this.siteResults = results;
      this.siteSearching = false;
    });

      this.wordpressService.sysConfig.subscribe(
        sysConfig => {
          if (sysConfig.wp_rest != '') {
            this.wpConfig = sysConfig;
            this.initPosts();
          } else {
            console.log("config is empty");
          }
        },
      error => {
        this.errorPosts = error;
      }
    );
  }
}
