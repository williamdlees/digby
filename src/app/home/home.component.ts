import {Component, OnInit, ViewChild} from '@angular/core';
import { Subscription } from 'rxjs';
import {WordpressService} from "./wordpress.service";
import {AuthService} from "../auth/auth.service";
import {SysConfig} from "../auth/sysconfig.model";

import { RouterLink } from '@angular/router';
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu } from '@ng-bootstrap/ng-bootstrap';
import { RepseqService } from 'projects/digby-swagger-client';
import { QUESTIONS, ENTRY_CARDS, CITATION, CONTRIBUTE } from './home-content';


@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [RouterLink, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu]
})
export class HomeComponent implements OnInit {
  loadedNewsPosts = [];
  loadingNews = false;
  errorNews = null;
  loadedHelpPosts = [];
  loadingHelp = false;
  errorHelp = null;
  wpConfig = new SysConfig(true, '', '', '');
  questions = QUESTIONS;
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
               private repseqService: RepseqService ) {  }

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

  fillNews() {
    this.loadingNews = true;
    this.wordpressService.fetchNews().subscribe(
      posts => {
        this.loadedNewsPosts = posts;
        this.loadingNews = false;
      },
      error => {
        this.errorNews = error;
        this.loadingNews = false;
      }
    );
  }

  fillHelp() {
    this.loadingHelp = true;
    this.wordpressService.fetchHelp().subscribe(
      posts => {
        this.loadedHelpPosts = posts;
        this.loadingHelp = false;
      },
      error => {
        this.errorHelp = error;
        this.loadingHelp = false;
      }
    );
  }

  copyCitation() {
    const c = this.citation;
    navigator.clipboard.writeText(`${c.authors} ${c.title} ${c.journal} ${c.doi}`)
      .then(() => this.copied = 'Copied', () => this.copied = 'Copy failed');
  }

  ngOnInit() {
      this.wordpressService.sysConfig.subscribe(
        sysConfig => {
          if (sysConfig.wp_rest != '') {
            this.wpConfig = sysConfig;
            this.fillNews();
            this.fillHelp();
          } else {
            console.log("config is empty");
          }
        },
      error => {
        this.errorHelp = error;
      }
    );
  }
}
