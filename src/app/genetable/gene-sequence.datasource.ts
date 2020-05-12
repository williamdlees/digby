import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {Observable, BehaviorSubject, of, EMPTY} from 'rxjs';
import { GenomicService } from '../../../dist/digby-swagger-client';
import {catchError, finalize} from 'rxjs/operators';
import {GeneSequence} from './gene-sequence.model';
import {retryWithBackoff} from '../shared/retry_with_backoff';


export class GeneSequenceDataSource implements DataSource<GeneSequence> {

    private geneSequenceSubject = new BehaviorSubject<GeneSequence[]>([]);
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string>(null);

    public loading$ = this.loadingSubject.asObservable();
    public error$ = this.errorSubject.asObservable();
    public totalItems = 0;

    constructor(private genomicService: GenomicService) {

    }

    loadGeneSequences(species: string, refSeq: string, imgt: boolean, novel: boolean, full: boolean,
                      filter: string, sortDirection: string, pageIndex: number, pageSize: number) {

        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        if (species && refSeq) {
          this.genomicService.getSequencesApi(species, refSeq, imgt, novel, full, filter, sortDirection, pageIndex, pageSize).pipe(
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
    }

}
