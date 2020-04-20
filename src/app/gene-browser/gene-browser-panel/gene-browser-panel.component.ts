/* tslint:disable:only-arrow-functions */
import {Component, OnInit, ViewChild, ElementRef, Input} from '@angular/core';
import {environment} from '../../../environments/environment';
import {GeneBrowserSelection} from '../gene-browser.model';
import { GeneBrowserService } from '../gene-browser.service';
import {ActivatedRoute} from '@angular/router';
// import {igv} from '../../../../node_modules/igv';

declare var igv: any;
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
    igv.createBrowser($('#igvdiv'),
      {
        reference: {
          id: this.species,
          fastaURL: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.fasta',
          indexURL: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.fasta.fai'
        }
      }).then((browser) => {
        this.browser = browser;
        browser.loadTrack({
          name: 'Genes',
          type: 'annotation',
          url: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.gff3',
      }).then(() => {
        this.browser.loadTrack({
          name: 'Samples',
          type: 'alignment',
          format: 'bam',
          url: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.bam',
          indexURL: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.bam.bai',
      }).then(() => {
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

    this.geneBrowserService.selectionUpdated.subscribe(
      (sel: GeneBrowserSelection) => {
        this.selection = sel;
        this.reconfigureBrowser();
      }
    );
  }

  reconfigureBrowser() {
    this.browser.loadGenome({
        id: this.selection.species,
        fastaURL: environment.igvBasePath + '/' + this.selection.species + '_' + this.selection.refSeq + '.fasta',
        indexURL: environment.igvBasePath + '/' + this.selection.species + '_' + this.selection.refSeq + '.fasta.fai'
    }).then(() => {
      this.browser.loadTrack({
          name: 'Genes',
          type: 'annotation',
          url: environment.igvBasePath + '/' + this.selection.species + '_' + this.selection.refSeq + '.gff3',
      }).then(() => {
        this.browser.loadTrack({
          name: 'Samples',
          type: 'alignment',
          format: 'bam',
          url: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.bam',
          indexURL: environment.igvBasePath + '/' + this.species + '_' + this.refName + '.bam.bai'
      }).then(() => {
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
