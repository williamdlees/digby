import {Component, OnInit, ViewEncapsulation, input} from '@angular/core';
import {ReportsService} from 'digby-swagger-client';
import {pollUntil} from '../../shared/poll-until-rxjs';
import {defer, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ReportErrorDialogComponent} from '../report-error-dialog/report-error-dialog.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ReportRequestService} from '../report-request-service';


@Component({
    selector: 'app-report-run-dialog',
    templateUrl: './report-run-dialog.component.html',
    styleUrls: ['./report-run-dialog.component.css'],
    encapsulation: ViewEncapsulation.None // needed for css styling
    ,
    imports: []
})
export class ReportRunDialogComponent implements OnInit {
  readonly report = input(undefined);
  readonly format = input(undefined);
  readonly params = input(undefined);
  readonly species = input(undefined);
  readonly genSeqs = input(undefined);
  readonly genFilters = input(undefined);
  readonly repSeqs = input(undefined);
  readonly repFilters = input(undefined);
  statusText = '';
  lastStatusText = '';
  errorText = '';
  reportTitle = '';
  enableRetry = false;
  reportRequest: ReportRequestService;
  reportResult$Subscription = null;

  constructor(
    public activeModal: NgbActiveModal,
    private reportsService: ReportsService,
  ) {

  }

  ngOnInit(): void {
    this.reportTitle = this.report().title;
    this.reportRequest = new ReportRequestService(this.reportsService);
    this.reportResult$Subscription = this.reportRequest.reportResult$.subscribe(
      (result) => {
        if (result.status === 'PENDING') {
          if (this.lastStatusText === result.info) {
            this.statusText = this.statusText + '.';
          } else {
            this.statusText = result.info;
            this.lastStatusText = result.info;
          }
          this.errorText = '';
        } else if (result.status === 'FAILURE') {
          this.statusText = '';
          this.errorText = result.info;
          this.enableRetry = true;
        } else if (result.status === 'SUCCESS') {
          this.activeModal.close(result.response);
        }
      }
    );

    this.requestReport();
  }

  requestReport(): void {
    this.enableRetry = false;
    this.lastStatusText = '';
    this.statusText = '';
    this.errorText = '';
    this.reportRequest.requestReport(this.report().name, this.format(), this.species(), this.genSeqs(), this.genFilters(), this.repSeqs(), this.repFilters(), this.params());
  }

}
