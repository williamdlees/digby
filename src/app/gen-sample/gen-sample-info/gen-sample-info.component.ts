import {Component, OnInit, ViewEncapsulation, input} from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {catchError, finalize} from 'rxjs/operators';
import { GenomicService } from 'projects/digby-swagger-client';
import {retryWithBackoff} from '../../shared/retry_with_backoff';
import {columnInfo} from "../gen-sample-panel/gen-sample-panel-cols";

import { MatTooltip } from '@angular/material/tooltip';


@Component({
    selector: 'app-gen-sample-info',
    templateUrl: './gen-sample-info.component.html',
    styleUrls: ['./gen-sample-info.component.css'],
    encapsulation: ViewEncapsulation.None // needed for css styling
    ,
    imports: [MatTooltip]
})

export class GenSampleInfoComponent implements OnInit {
  readonly sampleName = input(undefined);
  readonly species = input(undefined);
  readonly dataset = input(undefined);
  loading = false;
  error = null;
  sampleInfo = null;
  allColumns = columnInfo;

  constructor(public activeModal: NgbActiveModal,
              private modalService: NgbModal,
              private genSampleService: GenomicService) { }

  ngOnInit(): void {
    this.loading = true;
    this.error = null;

    this.genSampleService.getSubjectInfoApi(this.species(), this.dataset(), this.sampleName()).pipe(
      retryWithBackoff(),
      catchError(error => {
        this.error.next(error);
        return([]);
      }),
      finalize(() => {
        this.loading = false;
      })
    )
    .subscribe((sampleInfo) => {
      this.sampleInfo = sampleInfo;
    });
  }
}
