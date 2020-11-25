import {Component, Input, OnInit} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';


@Component({
  selector: 'app-seq-modal',
  templateUrl: './seq-modal.component.html',
  styleUrls: ['./seq-modal.component.scss']
})

export class SeqModalComponent implements OnInit {
  @Input() name;
  @Input() content;
  displayContent: string;
  width = 50;
  gapped = false;
  fasta = false;
  gappedAvailable = false;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
    // format display_content from the sequence in content
    // options tbd...

    this.gappedAvailable = this.content.gapped && this.content.gapped.length > 0;
    this.format_sequence();
  }

  format_sequence() {
    let ind = 1;
    this.displayContent = '';
    let content = '';

    if (this.gapped) {
      content = this.content.gapped ? this.content.gapped : '';
    } else {
      content = this.content.ungapped ? this.content.ungapped : '';
    }

    if (content) {
      if(this.fasta) {
        this.displayContent += '>' + this.name + '<br>';
      }

      for (const frag of this.chunkSubstr(content, this.width)) {
        if (this.fasta) {
          this.displayContent += frag + '<br>';
        } else {
          this.displayContent += _.padEnd(ind.toString(), 5);

          if (frag.length > 10) {
            this.displayContent += _.repeat(' ', frag.length - 10) + _.padStart((ind + frag.length - 1).toString(), 5) + '<br>' + frag + '<br><br>'
            ind += frag.length;
          }
        }
      }
    }
  }

  // split string into chunks of the specified size
  // https://stackoverflow.com/questions/7033639/split-large-string-in-n-size-chunks-in-javascript/29202760#29202760
  chunkSubstr(str, size) {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size);
    }

    return chunks;
  }

  onGappedClick(element) {
    this.gapped = !this.gapped;
    element.textContent = this.gapped ? 'Ungapped' : 'Gapped';
    this.format_sequence();
  }

  onFastaClick(element) {
    this.fasta = !this.fasta;
    element.textContent = this.fasta ? 'Numbered' : 'FASTA';
    this.format_sequence();
  }
}
