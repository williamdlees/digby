import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {retryWithBackoff} from '../../shared/retry_with_backoff';
import {catchError, finalize} from 'rxjs/operators';
import { RepseqService } from '../../../../dist/digby-swagger-client';


@Component({
  selector: 'app-sample-rep-info',
  templateUrl: './sample-rep-info.component.html',
  styleUrls: ['./sample-rep-info.component.css'],
  encapsulation: ViewEncapsulation.None   // needed for css styling
})
export class SampleRepInfoComponent implements OnInit {
  @Input() sampleName;
  @Input() species;
  @Input() dataset;
  loading = false;
  error = null;
  sampleInfo = null;

  constructor(public activeModal: NgbActiveModal,
              private modalService: NgbModal,
              private repseqService: RepseqService) { }

  ngOnInit(): void {
    this.loading = true;
    this.error = null;

    this.repseqService.getSampleInfoApi(this.species, this.dataset, this.sampleName).pipe(
//      retryWithBackoff(),
      catchError(error => {
        this.error.next(error);
        return([]);
      }),
      finalize(() => {
        console.log('component finalised');
        this.loading = false;
      })
    )
    .subscribe((sampleInfo) => {
      this.sampleInfo = sampleInfo;
    });
  }
}
