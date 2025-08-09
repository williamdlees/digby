import {Component, OnInit, ViewEncapsulation, input} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormGroup} from '@angular/forms';

@Component({
    selector: 'app-report-error-dialog',
    templateUrl: './report-error-dialog.component.html',
    styleUrls: ['./report-error-dialog.component.css'],
    encapsulation: ViewEncapsulation.None // needed for css styling
})
export class ReportErrorDialogComponent {
  readonly report = input(undefined);
  readonly errorMessage = input(undefined);

  constructor(public activeModal: NgbActiveModal) {
  }
}
