import { Component, Injectable, Input, OnChanges, SimpleChanges, OnInit, ViewEncapsulation } from '@angular/core';
import { RefbookService } from '../../../../dist/digby-swagger-client';
import { retryWithBackoff } from '../../shared/retry_with_backoff';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import {AvailableSpeciesAndData, SpeciesGeneSelection, testAvailableSpeciesAndData} from '../species-gene-selector/species-gene-selector.model';
import { OverviewData } from './dash-refbook-overview.model';
import { ChartConfiguration } from 'chart.js';


@Component({
  selector: 'app-dash-refbook-overview',
  templateUrl: './dash-refbook-overview.component.html',
  styleUrls: ['./dash-refbook-overview.component.css'],
  encapsulation: ViewEncapsulation.None
})

@Injectable({
  providedIn: 'root'
})

export class DashRefbookOverviewComponent implements OnInit, OnChanges {
  @Input() selection: SpeciesGeneSelection;
  isFetching: boolean;
  error: string;

  overviewData: OverviewData = {
    total: 0,
    novel: 0,
    baseline: 0,
    alleles: [],
    genomic_only_counts: [],
    vdjbase_only_counts: [],
    both_counts: []
  };

  // Create the chart data
  chartData = {
    labels: [], // Alleles as labels on the X-axis
    datasets: [
      {
        label: 'Genomic Only',
        data: [],
        backgroundColor: '#a9e1d4', // Color for Genomic Only
        borderColor: '#8DD3C7',
      },
      {
        label: 'AIRRseq Only',
        data: [],
        backgroundColor: '#FFA07A', // Color for AIRRseq Only
        borderColor: '#fa946b',
      },
      {
        label: 'Both',
        data: [],
        backgroundColor: '#ce93d8', // Color for Genomic + AIRRseq
        borderColor: '#ba68c8',
      }
    ]
  };

  // Chart configuration
  chartConfig = {
    type: 'bar',
    options: {
      responsive: true,
      scales: {
        x: {
          stacked: true, // Enable stacking on the X-axis
        },
        y: {
          stacked: true, // Enable stacking on the Y-axis
          beginAtZero: true,
          text: 'Sample Count' // Y-axis label
        }
      }
    }
};

constructor(private refbookService: RefbookService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('ngOnChanges in overview', changes);
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
           ; // Create a new object to trigger change detection
            console.log('overviewData', this.overviewData);
          });
    }
  }
}