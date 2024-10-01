import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {Observable, BehaviorSubject, of, EMPTY} from 'rxjs';
import { RepseqService } from '../../../dist/digby-swagger-client';
import {catchError, finalize} from 'rxjs/operators';
import { RepSample } from './rep-sample.model';
import {retryWithBackoff} from '../shared/retry_with_backoff';
import { IChoices } from '../table/filter/ichoices';

export class RepSampleDataSource implements DataSource<RepSample> {

    private repSampleSubject = new BehaviorSubject<RepSample[]>([]);
    private choicesSubject = new BehaviorSubject<IChoices>( {});
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string>(null);

    public choices$ = this.choicesSubject.asObservable();
    public loading$ = this.loadingSubject.asObservable();
    public error$ = this.errorSubject.asObservable();
    public totalItems = 0;

    constructor(private repseqService: RepseqService) {

    }

    loadRepSamples(species: string, refSeq: string, pageIndex: number, pageSize: number, filter: string, sortBy: string, cols: string) {

        // request Human_IGH in place of any Test entry
        refSeq = refSeq.split(',').map((x) => x === 'Test' ? 'IGH' : x).join();

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
            if (sequence !== undefined && sequence.hasOwnProperty('samples')) {
              this.repSampleSubject.next(sequence.samples);
            } else {
              this.repSampleSubject.next([]);
            }
          });
        } else {
          this.loadingSubject.next(false);
          this.totalItems = 0;
          this.repSampleSubject.next([]);
        }

    }

    connect(collectionViewer: CollectionViewer): Observable<RepSample[]> {
        return this.repSampleSubject.asObservable();
    }

    disconnect(collectionViewer: CollectionViewer): void {
        this.repSampleSubject.complete();
        this.loadingSubject.complete();
        this.errorSubject.complete();
        this.choicesSubject.complete();
    }
}
