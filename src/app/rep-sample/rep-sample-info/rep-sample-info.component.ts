import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {retryWithBackoff} from '../../shared/retry_with_backoff';
import {catchError, finalize} from 'rxjs/operators';
import { RepseqService } from 'projects/digby-swagger-client';
import { columnInfo } from '../rep-sample-panel/rep-sample-panel-cols';

@Component({
  selector: 'app-sample-rep-info',
  templateUrl: './rep-sample-info.component.html',
  styleUrls: ['./rep-sample-info.component.css'],
  encapsulation: ViewEncapsulation.None   // needed for css styling
})
export class RepSampleInfoComponent implements OnInit {
  @Input() sampleName;
  @Input() species;
  @Input() dataset;
  loading = false;
  error = null;
  sampleInfo = null;
  allColumns = columnInfo;

  constructor(public activeModal: NgbActiveModal,
              private modalService: NgbModal,
              private repseqService: RepseqService) { }

  ngOnInit(): void {
    this.loading = true;
    this.error = null;

    this.repseqService.getSampleInfoApi(this.species, this.dataset, this.sampleName).pipe(
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
