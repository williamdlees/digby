import { Injectable } from '@angular/core';
import {ReportParamsDialogComponent} from './report-params-dialog/report-params-dialog.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ReportRunDialogComponent} from './report-run-dialog/report-run-dialog.component';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Subscription} from 'rxjs';
import {ReportErrorDialogComponent} from './report-error-dialog/report-error-dialog.component';
import {ReportRequestService} from './report-request-service';
import {ReportsService} from 'digby-swagger-client';
import {ReportsListDataSource} from './reports-list-data.source';

@Injectable({
  providedIn: 'root'
})
export class ReportRunService {
  globalReportFilterParamsSubscription = null;
  globalReportFilters = null;
  reportWindow = null;
  reportRequest = null;
  reportResult$Subscription: Subscription;
  lastReportInfo = '';

  constructor(
    private modalService: NgbModal,
    private reportsService: ReportsService,
    private reportsListDataSource: ReportsListDataSource,
    private httpClient: HttpClient,
  )
  {
    this.globalReportFilterParamsSubscription = this.reportsListDataSource.globalReportFilterParams$.subscribe(
      globalReportFilters => {
        this.globalReportFilters = globalReportFilters;
      }
    );

    this.reportRequest = new ReportRequestService(this.reportsService);
    this.reportResult$Subscription = this.reportRequest.reportResult$.subscribe(
      (result) => {
        if (this.reportWindow) {
          if (result.status === 'PENDING') {
            if (result.info === this.lastReportInfo) {
              this.reportWindow.document.getElementById('status_line').innerHTML =
                this.reportWindow.document.getElementById('status_line').innerHTML + '.';
            } else {
              this.reportWindow.document.getElementById('status_line').innerHTML = result.info;
              this.lastReportInfo = result.info;
            }
          } else if (result.status === 'FAILURE') {
            this.reportWindow.close();
            this.reportWindow = null;
            this.displayError(result.info);
          } else if (result.status === 'SUCCESS') {
            this.reportWindow.location = result.response.results.url;
          }
        }
      }
    );
  }

  runReport(report, format, species, genDataSets, genSampleFilters, repDataSets, repSampleFilters) {
    if (report.params.length > 0 || report.filter_params) {
      const modalRef = this.modalService.open(ReportParamsDialogComponent, {size: 'm'});
      modalRef.componentInstance.report = report;

      let filterParams = null;

      if (report.filter_params) {
        if (report.scope.length > 1) {
          filterParams = this.globalReportFilters.combined;
        } else if (report.scope.indexOf('rep_sample') >= 0) {
          filterParams = this.globalReportFilters.rep;
        } else {
          filterParams = this.globalReportFilters.gen;
        }
      }

      modalRef.componentInstance.filterParams = filterParams;

      modalRef.result.then((result) => {
        if (result) {
          this.sendReportRequest(report, format, species, result, genDataSets, genSampleFilters, repDataSets, repSampleFilters);
        }
      }, () => {
      });
    } else {
      this.sendReportRequest(report, format, species, {}, genDataSets, genSampleFilters, repDataSets, repSampleFilters);
    }
  }

  private sendReportRequest(report, format, species, params, genDataSets, genSampleFilters, repDataSets, repSampleFilters) {
    params = JSON.stringify(params);

    if (format !== 'html') {
      this.sendDownloadReportRequest(report, format, species,
        genDataSets.join(','), JSON.stringify(genSampleFilters),
        repDataSets.join(','), JSON.stringify(repSampleFilters),
        params);
    } else {
      this.sendHtmlReportRequest(report, format, species,
        genDataSets.join(','), JSON.stringify(genSampleFilters),
        repDataSets.join(','), JSON.stringify(repSampleFilters),
        params);
    }
  }

  private sendDownloadReportRequest(report, format: string, species: string, genSeqs: string, genFilters: string, repSeqs: string,
                                    repFilters: string, params: string) {
    const modalRef = this.modalService.open(ReportRunDialogComponent, {size: 'm'});
    modalRef.componentInstance.report = report;
    modalRef.componentInstance.format = format;
    modalRef.componentInstance.species = species;
    modalRef.componentInstance.genSeqs = genSeqs;
    modalRef.componentInstance.genFilters = genFilters;
    modalRef.componentInstance.repSeqs = repSeqs;
    modalRef.componentInstance.repFilters = repFilters;
    modalRef.componentInstance.params = params;

    modalRef.result.then((response) => {
      if (response.status === 'SUCCESS') {
      const token = 'my JWT';
      const headers = new HttpHeaders().set('authorization', 'Bearer ' + token);
      this.httpClient.get(response.results.url, {headers, responseType: 'blob' as 'json'}).subscribe(
        (rep: any) => {
          const downloadLink = document.createElement('a');
          downloadLink.href = window.URL.createObjectURL(rep);
          downloadLink.setAttribute('download', response.results.filename);
          document.body.appendChild(downloadLink);
          downloadLink.click();
        });
      }
    });
  }

  private sendHtmlReportRequest(report, format: string, species: string, genSeqs: string, genFilters: string, repSeqs: string,
                                repFilters: string, params: string) {
    this.reportWindow = window.open('', '_blank');

    this.reportWindow.document.write(
      '<h3>Preparing your report...</h3>' +
      '<p id="status_line"></p>'
    );

    this.reportRequest.requestReport(report.name, format, species, genSeqs, genFilters, repSeqs, repFilters, params);
  }

  private displayError(error) {
    const modalRef = this.modalService.open(ReportErrorDialogComponent, {size: 'm'});
    modalRef.componentInstance.report = 'Error running report';
    modalRef.componentInstance.errorMessage = error;

    modalRef.result.then();
  }
}
