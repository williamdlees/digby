import {Component, OnInit, input} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'app-seq-modal',
    templateUrl: './seq-modal.component.html',
    styleUrls: ['./seq-modal.component.scss']
})

export class SeqModalComponent implements OnInit {
  readonly name = input(undefined);
  readonly content = input(undefined);
  displayContent: string;
  width = 50;
  gapped = false;
  fasta = false;
  gappedAvailable = false;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
    // format display_content from the sequence in content
    // options tbd...

    const content = this.content();
    this.gappedAvailable = content.gapped && content.gapped.length > 0;
    this.format_sequence();
  }

  format_sequence() {
    let ind = 1;
    this.displayContent = '';
    let content = '';

    if (this.gapped) {
      const contentValue = this.content();
      content = contentValue.gapped ? contentValue.gapped : '';
    } else {
      const contentValue = this.content();
      content = contentValue.ungapped ? contentValue.ungapped : '';
    }

    if (content) {
      if(this.fasta) {
        this.displayContent += '>' + this.name() + '<br>';
      }

      for (const frag of this.chunkSubstr(content, this.width)) {
        if (this.fasta) {
          this.displayContent += frag + '<br>';
        } else {
          this.displayContent += ind.toString().padEnd(5);

          if (frag.length > 10) {
            this.displayContent += ' '.repeat(frag.length - 10) + (ind + frag.length - 1).toString().padStart(5)
          }
          this.displayContent += '<br>' + frag + '<br><br>'
          ind += frag.length;
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
