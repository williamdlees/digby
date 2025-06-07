import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormGroup} from '@angular/forms';

@Component({
    selector: 'app-report-error-dialog',
    templateUrl: './report-error-dialog.component.html',
    styleUrls: ['./report-error-dialog.component.css'],
    encapsulation: ViewEncapsulation.None // needed for css styling
    ,
    standalone: false
})
export class ReportErrorDialogComponent {
  @Input() report;
  @Input() errorMessage;

  constructor(public activeModal: NgbActiveModal) {
  }
}
