/* tslint:disable:only-arrow-functions */
import {Component, OnInit, ViewChild, ElementRef, Input} from '@angular/core';
import {environment} from '../../../environments/environment';
import { GeneTableSelection } from '../../genetable/gene-table.model';
import { GeneTableService } from '../../genetable/gene-table.service';
import {ActivatedRoute} from '@angular/router';
import igv from 'src/assets/js/igv.js';
import { delay } from 'rxjs/operators';

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
  browserInit = false;

  @Input() selection: GeneTableSelection;
  @ViewChild('igv', {static: true}) igvdiv: ElementRef;

  constructor(private geneTableService: GeneTableService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    console.log('subscribing to geneTableService');
    this.geneTableService.source.subscribe(
    (sel: GeneTableSelection) => {
      console.log('selection change: ' + sel.species);
      this.selection = sel;
      this.reconfigureBrowser();
    });
  }

  reconfigureBrowser() {
    this.species = this.selection.species.replace(' ', '_');
    this.refName = this.selection.refSeqs.replace(' ', '_');

    if (this.browser) {
      console.log('remove browser');
      igv.removeBrowser(this.browser);
    }

    console.log('build browser');
    this.buildBrowser();
  }


  buildBrowser() {
    console.log('creating browser');
    console.log(environment.igvBasePath + '/' + this.species + '_' + this.refName + '.fasta')
    delay(0);
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
      delay(0);
      console.log('creating browser 1');
      this.browser = browser;
      this.browser.loadTrack({
        name: 'Genes',
        type: 'annotation',
        url: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.gff3',
      }).then(() => {
        console.log('creating browser 2');
        this.browser.loadTrack({
          name: 'Samples',
          type: 'alignment',
          format: 'bam',
          url: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.bam',
          indexURL: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.bam.bai'
        }).then(() => {
          console.log('creating browser 3');
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
