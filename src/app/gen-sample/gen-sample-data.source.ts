import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {Observable, BehaviorSubject, of, EMPTY} from 'rxjs';
import { GenomicService } from '../../../dist/digby-swagger-client';
import {catchError, finalize} from 'rxjs/operators';
import { GenSample } from './gen-sample.model';
import {retryWithBackoff} from '../shared/retry_with_backoff';
import { IChoices } from '../table/filter/ichoices';

export class GenSampleDataSource implements DataSource<GenSample> {

    private genSampleSubject = new BehaviorSubject<GenSample[]>([]);
    private choicesSubject = new BehaviorSubject<IChoices>( {});
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string>(null);

    public choices$ = this.choicesSubject.asObservable();
    public loading$ = this.loadingSubject.asObservable();
    public error$ = this.errorSubject.asObservable();
    public totalItems = 0;

    constructor(private genomicService: GenomicService) {

    }

    loadGenSamples(species: string, refSeq: string, pageIndex: number, pageSize: number, filter: string, sortBy: string, cols: string) {

        // request Human_IGH in place of any Test entry
        refSeq = refSeq.split(',').map((x) => x === 'Test' ? (species === 'Human' ? 'Human_IGH' : 'GU129139') : x).join();

        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        if (species && refSeq) {
          this.genomicService.getSamplesApi(species, refSeq, pageIndex, pageSize, filter, sortBy, cols).pipe(
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
            console.log('next gen sample: ' + sequence.total_items);
            this.choicesSubject.next(sequence.uniques);
            this.genSampleSubject.next(sequence.samples);
          });
        } else {
          this.loadingSubject.next(false);
          this.totalItems = 0;
          this.genSampleSubject.next([]);
        }

    }

    connect(collectionViewer: CollectionViewer): Observable<GenSample[]> {
        return this.genSampleSubject.asObservable();
    }

    disconnect(collectionViewer: CollectionViewer): void {
        this.genSampleSubject.complete();
        this.loadingSubject.complete();
        this.errorSubject.complete();
        this.choicesSubject.complete();
    }

}
