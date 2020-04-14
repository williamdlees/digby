import {Component, OnInit, ViewChild, ElementRef, Input} from '@angular/core';
import {environment} from '../../../environments/environment';
import {GeneBrowserSelection} from '../gene-browser.model';

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
  @Input() selection: GeneBrowserSelection;

  constructor() { }
  @ViewChild('igv', {static: true}) igvdiv: ElementRef;

  ngOnInit() {
    // tslint:disable-next-line:only-arrow-functions
    igv.createBrowser($('#igvdiv'), options).then(function(browser) {
                    console.log('Created IGV browser');
                });
  }
}
