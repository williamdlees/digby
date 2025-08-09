import {Component, Input, OnInit, ViewEncapsulation, input} from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RepseqService } from 'projects/digby-swagger-client';
import {DomSanitizer} from '@angular/platform-browser';
import { SafePipe } from '../../safe.pipe';

@Component({
    selector: 'app-rep-gene-notes',
    templateUrl: './rep-gene-notes.component.html',
    styleUrls: ['./rep-gene-notes.component.scss'],
    encapsulation: ViewEncapsulation.None // needed for css styling
    ,
    imports: [SafePipe]
})

export class RepGeneNotesComponent implements OnInit {
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() notes;
  readonly sequenceName = input(undefined);

  constructor(public activeModal: NgbActiveModal,
              private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.notes = this.notes.replace(/\n/g, '<br><br>');
  }
}
