import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {Observable, BehaviorSubject, of, EMPTY} from 'rxjs';
import { RepseqService } from '../../../dist/digby-swagger-client';
import {catchError, finalize} from 'rxjs/operators';
import { RepSequence } from './rep-sequence.model';
import {retryWithBackoff} from '../shared/retry_with_backoff';
import { IChoices } from '../table/filter/ichoices';

export class RepSequenceDataSource implements DataSource<RepSequence> {

    private repSequenceSubject = new BehaviorSubject<RepSequence[]>([]);
    private choicesSubject = new BehaviorSubject<IChoices>( {});
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string>(null);

    public choices$ = this.choicesSubject.asObservable();
    public loading$ = this.loadingSubject.asObservable();
    public error$ = this.errorSubject.asObservable();
    public totalItems = 0;

    constructor(private repseqService: RepseqService) {

    }

    loadRepSequences(species: string, refSeq: string, pageIndex: number, pageSize: number, filter: string, sortBy: string,  cols: string) {

        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        if (species && refSeq) {
          this.repseqService.getSamplesApi(species, refSeq, pageIndex, pageSize, filter, sortBy, cols).pipe(
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
            this.repSequenceSubject.next(sequence.samples);
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
