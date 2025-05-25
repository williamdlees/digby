import { Component, Injectable, Input, OnChanges, SimpleChanges, OnInit, ViewEncapsulation } from '@angular/core';
import { RefbookService } from '../../../../dist/digby-swagger-client';
import { retryWithBackoff } from '../../shared/retry_with_backoff';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import {AvailableSpeciesAndData, SpeciesGeneSelection, testAvailableSpeciesAndData} from '../species-gene-selector/species-gene-selector.model';
import { AlignmentData } from './dash-refbook-alignment.model';


@Component({
  selector: 'app-dash-refbook-alignment',
  templateUrl: './dash-refbook-alignment.component.html',
  styleUrls: ['./dash-refbook-alignment.component.css'],
  encapsulation: ViewEncapsulation.None
})

@Injectable({
  providedIn: 'root'
})

export class DashRefbookAlignmentComponent implements OnInit, OnChanges {
  @Input() selection: SpeciesGeneSelection;
  isFetching: boolean;
  error: string;

    // Create the chart data
  chartData = {

  };

  // Chart configuration
  chartConfig = {
  };

  constructor(private refbookService: RefbookService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('ngOnChanges in alignment', changes);
    if (changes['selection'] && changes['selection'].currentValue) {
        const cs = changes['selection'].currentValue;
        this.selection = changes['selection'].currentValue;
        this.refbookService.getAscsOverview(cs.species, cs.chain, cs.asc)
          .pipe(
            retryWithBackoff(),
            catchError(err => {
              this.error = err;
              return EMPTY;
            })
          )
          .subscribe((data: OverviewData) => {
            this.isFetching = false;
            this.overviewData = data;
            this.chartData.labels = data.alleles;
            this.chartData.datasets[0].data = data.genomic_only_counts;
            this.chartData.datasets[1].data = data.vdjbase_only_counts;
            this.chartData.datasets[2].data = data.both_counts;
            this.chartData = {...this.chartData}; // Create a new object to trigger change detection
            console.log('overviewData', this.overviewData);
          });
    }
  }
}