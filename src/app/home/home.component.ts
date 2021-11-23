import {Component, OnInit, ViewChild} from '@angular/core';
import { Subscription } from 'rxjs';
import {WordpressService} from "./wordpress.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  loadedNewsPosts = [];
  loadingNews = false;
  errorNews = null;
  loadedHelpPosts = [];
  loadingHelp = false;
  errorHelp = null;
  wpConfig = null;

  constructor( private wordpressService: WordpressService ) {  }

  fillNews() {
    this.loadingNews = true;
    this.wordpressService.fetchNews().subscribe(
      posts => {
        this.loadedNewsPosts = posts;
        this.loadingNews = false;
      },
      error => {
        this.errorNews = error;
        console.log('error in main')
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
        console.log('error in main')
        this.loadingHelp = false;
      }
    );
  }

  ngOnInit() {
      this.wordpressService.init().subscribe(
        resp => {
          this.wpConfig = resp;
          this.fillNews();
          this.fillHelp();
        },
      error => {
        this.errorHelp = error;
        console.log('error in main')
      }
    );
  }
}
