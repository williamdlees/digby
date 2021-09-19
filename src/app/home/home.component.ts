import { Component, OnInit } from '@angular/core';
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

  constructor( private wordpressService: WordpressService ) {  }

  ngOnInit() {
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

}
