import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {Observable, BehaviorSubject, of, EMPTY} from 'rxjs';
import { RepseqService } from '../../../dist/digby-swagger-client';
import {catchError, finalize} from 'rxjs/operators';
import {RepSequence} from './rep-sequence.model';
import {retryWithBackoff} from '../shared/retry_with_backoff';
import {IChoices} from '../table/filter/ichoices';
import { set } from 'lodash';


export class RepSequenceDataSource implements DataSource<RepSequence> {

    private repSequenceSubject = new BehaviorSubject<RepSequence[]>([]);
    private choicesSubject = new BehaviorSubject<IChoices>( {});
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string>(null);
    private extraColsSubject = new BehaviorSubject<[]>([]);

    public choices$ = this.choicesSubject.asObservable();
    public loading$ = this.loadingSubject.asObservable();
    public error$ = this.errorSubject.asObservable();
    public extraCols$ = this.extraColsSubject.asObservable();
    public totalItems = 0;
    public extra_cols: [] = [];

    constructor(private repseqService: RepseqService) {

    }

    loadRepSequences(species: string, refSeq: string, filter: string, sortBy: string, pageIndex: number, pageSize: number, cols: string) {

        // request Human_IGH in place of any Test entry
        refSeq = refSeq.split(',').map((x) => x === 'Test' ? 'IGH' : x).join();

        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        if (species && refSeq) {
          this.repseqService.getSequencesApi(species, refSeq, pageIndex, pageSize, filter, sortBy, cols).pipe(
            retryWithBackoff(),
            catchError(error => {
              this.errorSubject.next(error);
              return([]);
            }),
            finalize(() => {
              this.loadingSubject.next(false);
            })
          )
            .subscribe((sequence) => {
              this.totalItems = sequence.total_items;
              this.choicesSubject.next(sequence.uniques);

              if (sequence !== undefined && sequence.hasOwnProperty('samples')) {
                if (sequence.hasOwnProperty('extra_cols') && !arraysEqual(this.extra_cols, sequence.extra_cols)) {
                  this.extra_cols = sequence.extra_cols;
                } else {
                  this.extra_cols = [];
                }
                this.extraColsSubject.next(this.extra_cols);

                setTimeout(() => {
                this.repSequenceSubject.next(sequence.samples);
                }, 50);

              } else {
                this.repSequenceSubject.next([]);
              }
            });
        } else {
          this.loadingSubject.next(false);
          this.totalItems = 0;
          this.repSequenceSubject.next([]);
        }

    }

    connect(collectionViewer: CollectionViewer): Observable<RepSequence[]> {
        return this.repSequenceSubject.asObservable();
    }

    disconnect(collectionViewer: CollectionViewer): void {
        this.repSequenceSubject.complete();
        this.loadingSubject.complete();
        this.errorSubject.complete();
        this.choicesSubject.complete();
    }

}

function arraysEqual(a1, a2) {
  return a1.length === a2.length && a1.every((v) => a2.includes(v));
}

