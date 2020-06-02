import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {Observable, BehaviorSubject, of, EMPTY} from 'rxjs';
import { GenomicService } from '../../../dist/digby-swagger-client';
import {catchError, finalize} from 'rxjs/operators';
import {GeneSequence} from './gene-sequence.model';
import {retryWithBackoff} from '../shared/retry_with_backoff';
import {IChoices} from '../table/filter/ichoices';


export class GeneSequenceDataSource implements DataSource<GeneSequence> {

    private geneSequenceSubject = new BehaviorSubject<GeneSequence[]>([]);
    private choicesSubject = new BehaviorSubject<IChoices>( {});
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string>(null);

    public choices$ = this.choicesSubject.asObservable();
    public loading$ = this.loadingSubject.asObservable();
    public error$ = this.errorSubject.asObservable();
    public totalItems = 0;

    constructor(private genomicService: GenomicService) {

    }

    loadGeneSequences(species: string, refSeq: string, imgt: boolean, novel: boolean, full: boolean,
                      filter: string, sortBy: string, pageIndex: number, pageSize: number, cols: string) {

        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        if (species && refSeq) {
          this.genomicService.getSequencesApi(species, refSeq, imgt, novel, full, filter, sortBy, cols, pageIndex, pageSize).pipe(
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
              this.geneSequenceSubject.next(sequence.sequences);
            });
        } else {
          this.loadingSubject.next(false);
          this.totalItems = 0;
          this.geneSequenceSubject.next([]);
        }

    }

    connect(collectionViewer: CollectionViewer): Observable<GeneSequence[]> {
        return this.geneSequenceSubject.asObservable();
    }

    disconnect(collectionViewer: CollectionViewer): void {
        this.geneSequenceSubject.complete();
        this.loadingSubject.complete();
        this.errorSubject.complete();
        this.choicesSubject.complete();
    }

}
