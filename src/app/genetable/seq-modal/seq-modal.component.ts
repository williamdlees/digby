import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-seq-modal',
  templateUrl: './seq-modal.component.html',
  styleUrls: ['./seq-modal.component.scss']
})
export class SeqModalComponent {
  @Input() name;
  @Input() content;

  constructor(public activeModal: NgbActiveModal) { }

}
