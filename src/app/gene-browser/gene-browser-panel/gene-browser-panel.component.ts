/* tslint:disable:only-arrow-functions */
import {Component, OnInit, ViewChild, ElementRef, Input} from '@angular/core';
import {environment} from '../../../environments/environment';
import {GeneBrowserSelection} from '../gene-browser.model';
import { GeneBrowserService } from '../gene-browser.service';
import {ActivatedRoute} from '@angular/router';
import igv from 'src/assets/js/igv.js';

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

export class GeneBrowserPanelComponent implements OnInit {
  browser = null;
  species = 'Human';
  refName = 'Human_IGH';

  @Input() selection: GeneBrowserSelection;
  @ViewChild('igv', {static: true}) igvdiv: ElementRef;

  constructor(private geneBrowserService: GeneBrowserService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.species = this.route.snapshot.params.speciesName;
    this.refName = this.route.snapshot.params.refName;
    this.buildBrowser();

    this.geneBrowserService.selectionUpdated.subscribe(
      (sel: GeneBrowserSelection) => {
        this.selection = sel;
        this.reconfigureBrowser();
      }
    );
  }

  reconfigureBrowser() {
    this.species = this.selection.species;
    this.refName = this.selection.refSeq;
    igv.removeBrowser(this.browser);
    this.buildBrowser();
  }


  buildBrowser() {
    igv.createBrowser($('#igvdiv'),
      {
        reference: {
          id: this.species,
          fastaURL: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.fasta',
          indexURL: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.fasta.fai'
        },
        search: {
          url: environment.apiBasePath +  '/genomic/feature_pos/' + this.species + '/' + this.refName + '/$FEATURE$'
        }
    }).then((browser) => {
      console.log('browser created');
      this.browser = browser;
      this.browser.loadTrack({
        name: 'Genes',
        type: 'annotation',
        url: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.gff3',
      }).then(() => {
        console.log('browser created 2');
        this.browser.loadTrack({
          name: 'Samples',
          type: 'alignment',
          format: 'bam',
          url: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.bam',
          indexURL: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.bam.bai'
        }).then(() => {
        console.log('browser created 3');
        this.browser.loadTrack({
            name: 'Refs',
            type: 'alignment',
            format: 'bam',
            url: environment.igvBasePath + '/' + this.species + '_' + this.refName + '_imgt.bam',
            indexURL: environment.igvBasePath + '/' + this.species + '_' + this.refName + '_imgt.bam.bai',
          });
        });
      });
    });
  }
}
