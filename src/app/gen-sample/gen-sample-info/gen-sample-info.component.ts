import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {catchError, finalize} from 'rxjs/operators';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import {retryWithBackoff} from '../../shared/retry_with_backoff';


@Component({
  selector: 'app-gen-sample-info',
  templateUrl: './gen-sample-info.component.html',
  styleUrls: ['./gen-sample-info.component.css']
})

export class GenSampleInfoComponent implements OnInit {
  @Input() subjectName;
  @Input() species;
  @Input() dataset;
  loading = false;
  error = null;
  sampleInfo = null;

  constructor(public activeModal: NgbActiveModal,
              private modalService: NgbModal,
              private genSampleService: GenomicService) { }

  ngOnInit(): void {
    this.loading = true;
    this.error = null;

    this.genSampleService.getSubjectInfoApi(this.species, this.dataset, this.subjectName).pipe(
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
