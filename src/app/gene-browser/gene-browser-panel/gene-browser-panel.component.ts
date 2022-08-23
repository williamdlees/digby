/* tslint:disable:only-arrow-functions */
import {Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, AfterViewInit} from '@angular/core';
import {environment} from '../../../environments/environment';
import { GeneTableSelection } from '../../gene-table-selector/gene-table-selector.model';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
import {ActivatedRoute} from '@angular/router';
import igv from 'src/assets/js/igv.js';
import {debounceTime, delay} from 'rxjs/operators';
import {AuthService} from "../../auth/auth.service";
import {User} from "../../auth/user.model";

// declare var igv: any;
declare var $: any;

const options = {
   reference: {
      id: 'Atlantic_Salmon',
      fastaURL: environment.igvBasePath + '/' + 'Atlantic_Salmon_GU129139.fasta',
      indexURL: environment.igvBasePath + '/' + 'Atlantic_Salmon_GU129139.fasta.fai'
    },
    tracks: [
        {
          name: 'Genes',
          type: 'annotation',
          url: environment.igvBasePath + '/' + 'Atlantic_Salmon_GU129139.gff3',
          indexURL: environment.igvBasePath + '/' + 'Atlantic_Salmon_GU129139.gff3.idx'
        }
    ]
};

@Component({
  selector: 'app-gene-browser-panel',
  templateUrl: './gene-browser-panel.component.html',
  styleUrls: ['./gene-browser-panel.component.scss']
})

export class GeneBrowserPanelComponent implements OnInit, OnDestroy {
  browser = null;
  geneTableServiceSubscription = null;
  authServiceSubscription = null;

  @Input() selection: GeneTableSelection;
  @ViewChild('igv', {static: true}) igvdiv: ElementRef;

  species = null;
  dataset = null;
  assemblyName = null;
  user = null;

  constructor(private geneTableService: GeneTableSelectorService,
              private route: ActivatedRoute,
              private authService: AuthService) {
  }

  ngOnInit() {
    this.geneTableServiceSubscription = this.geneTableService.source.pipe(debounceTime(500)).subscribe(
    (sel: GeneTableSelection) => {
      this.selection = sel;
      this.reconfigureBrowser();
    });

    this.authServiceSubscription = this.authService.user.subscribe(
      (user: User) => {
        this.user = user;
        if (user.accessToken) {
          igv.setOauthToken(user.accessToken, location.hostname)
        }
      }
    );
  }

  ngOnDestroy() {
    this.geneTableServiceSubscription.unsubscribe();
    this.authServiceSubscription.unsubscribe();
  }

  reconfigureBrowser() {
    if (this.selection.species) {
      this.species = this.selection.species ;
    } else {
      this.species = null;
    }

    if (this.selection.datasets) {
      this.dataset = this.selection.datasets[0];
    } else {
      this.dataset = null;
    }

    if (this.selection.assemblies.length > 0) {
      this.assemblyName = this.selection.assemblies[0].replace(' ', '_');
    } else {
      this.assemblyName = null;
    }

    if (this.browser) {
      igv.removeBrowser(this.browser);
      this.browser = null;
    }

    if (this.species && this.dataset && this.assemblyName) {
      this.buildBrowser();
    }
  }

  buildBrowser() {
    delay(0);
    const dataPath = environment.igvBasePath + '/' + this.species.replace(' ', '_') + '/' + this.dataset + '/' + this.species.replace(' ', '_') + '_' + this.assemblyName;
    const div = document.getElementById('igvdiv');

    if (div == null) {      // will happen if page is not displayed
      this.browser = null;
      return;
    }

    console.log('BuildBrowser: ' + dataPath);

    igv.createBrowser(div,
      {
        reference: {
          id: this.species,
          fastaURL: dataPath + '.fasta',
          indexURL: dataPath + '.fasta.fai'
        },
        search: {
          url: environment.apiBasePath +  '/genomic/feature_pos/' + this.species + '/' + this.dataset + '/' + this.assemblyName + '/$FEATURE$'
        }
    }).then((browser) => {
      delay(0);
      this.browser = browser;
      this.browser.loadTrack({
        name: 'Reference',
        type: 'annotation',
        url: dataPath + '.gff3',
        height: 100,
      }).then(() => {
        this.browser.loadTrack({
          name: 'Sample Features',
          type: 'alignment',
          format: 'bam',
          url: dataPath + '.bam',
          indexURL: dataPath + '.bam.bai',
          height: 500,
        }).then(() => {
          this.browser.loadTrack({
            name: 'Sample genes',
            type: 'alignment',
            format: 'bam',
            url: dataPath + '_phased.bam',
            indexURL: dataPath + '_phased.bam.bai',
            height: 500,
          });
        });
      });
    });
  }
}
