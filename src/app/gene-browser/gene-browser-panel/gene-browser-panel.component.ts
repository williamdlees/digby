/* tslint:disable:only-arrow-functions */
import {Component, OnInit, OnDestroy, ViewChild, ElementRef, Input} from '@angular/core';
import {environment} from '../../../environments/environment';
import { GeneTableSelection } from '../../gene-table-selector/gene-table-selector.model';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
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

export class GeneBrowserPanelComponent implements OnInit, OnDestroy {
  browser = null;
  geneTableServiceSubscription = null;

  @Input() selection: GeneTableSelection;
  @ViewChild('igv', {static: true}) igvdiv: ElementRef;

  species = null;
  assemblyName = null;

  constructor(private geneTableService: GeneTableSelectorService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.geneTableServiceSubscription = this.geneTableService.source.subscribe(
    (sel: GeneTableSelection) => {
      this.selection = sel;
      this.reconfigureBrowser();
    });
  }

  ngOnDestroy() {
    this.geneTableServiceSubscription.unsubscribe();
  }

  reconfigureBrowser() {
    if (this.selection.species) {
      this.species = this.selection.species.replace(' ', '_');
    } else {
      this.species = null;
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

    if (this.species && this.assemblyName) {

      this.buildBrowser();
    }
  }


  buildBrowser() {
    delay(0);
    igv.createBrowser($('#igvdiv'),
      {
        reference: {
          id: this.species,
          fastaURL: environment.igvBasePath + '/' + this.species + '_' + this.assemblyName + '.fasta',
          indexURL: environment.igvBasePath + '/' + this.species + '_' + this.assemblyName + '.fasta.fai'
        },
        search: {
          url: environment.apiBasePath +  '/genomic/feature_pos/' + this.species + '/' + this.assemblyName + '/$FEATURE$'
        }
    }).then((browser) => {
      delay(0);
      this.browser = browser;
      this.browser.loadTrack({
        name: 'Genes',
        type: 'annotation',
        url: environment.igvBasePath + '/' + this.species + '_' + this.assemblyName + '.gff3',
      }).then(() => {
        this.browser.loadTrack({
          name: 'Samples',
          type: 'alignment',
          format: 'bam',
          url: environment.igvBasePath + '/' + this.species + '_' + this.assemblyName + '.bam',
          indexURL: environment.igvBasePath + '/' + this.species + '_' + this.assemblyName + '.bam.bai'
        }).then(() => {
          this.browser.loadTrack({
            name: 'Refs',
            type: 'alignment',
            format: 'bam',
            url: environment.igvBasePath + '/' + this.species + '_' + this.assemblyName + '_imgt.bam',
            indexURL: environment.igvBasePath + '/' + this.species + '_' + this.assemblyName + '_imgt.bam.bai',
          });
        });
      });
    });
  }
}
