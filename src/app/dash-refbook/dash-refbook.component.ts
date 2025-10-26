import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { SpeciesGeneSelection } from '../shared/models/species-gene-selection.model';
import { GeneTableSelectorComponent } from '../gene-table-selector/gene-table-selector.component';
import { GeneTableSelectorService } from '../gene-table-selector/gene-table-selector.service';
import { GeneTableSelection } from '../gene-table-selector/gene-table-selector.model';
import { DashRefbookOverviewComponent } from './dash-refbook-overview/dash-refbook-overview.component';
import { DashRefbookAlignmentComponent } from './dash-refbook-alignment/dash-refbook-alignment.component';
import { DashRefbookUsageComponent } from './dash-refbook-usage/dash-refbook-usage.component';
import { DashRefbookZygosityComponent } from './dash-refbook-zygosity/dash-refbook-zygosity.component';
import { RefbookService } from '../../../projects/digby-swagger-client/api/refbook.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, takeUntil, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-dash-refbook',
  templateUrl: './dash-refbook.component.html',
  styleUrls: ['./dash-refbook.component.scss'],
  standalone: true,
  imports: [
    MatTabsModule,
    FormsModule,
    GeneTableSelectorComponent,
    DashRefbookOverviewComponent,
    DashRefbookAlignmentComponent,
    DashRefbookUsageComponent,
    DashRefbookZygosityComponent
  ],
  providers: [
    {
      provide: RefbookService,
      useClass: RefbookService
    }
  ]
})
export class DashRefbookComponent implements OnInit, OnDestroy {
  selection: SpeciesGeneSelection = {
    species: undefined, chain: undefined, asc: undefined
  };

  availableAscs: string[] = [];
  ascLoading = false;
  ascError: string | null = null;
  ascDisabled = true;
  selectedTabIndex = 0;
  genomic_present: boolean = false;
  airrseq_present: boolean = false

  private destroy$ = new Subject<void>();
  private geneTableSubscription: Subscription;
  private ascLoadSubject = new Subject<{species: string, chain: string}>();

  constructor(
    private geneTableService: GeneTableSelectorService,
    private refbookService: RefbookService
  ) {
    // Setup debounced ASC loading
    this.ascLoadSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(({species, chain}) => {
      this.loadAscs(species, chain);
    });
  }

  ngOnInit(): void {
    // Subscribe to gene table selector changes
    this.geneTableSubscription = this.geneTableService.selection
      .pipe(takeUntil(this.destroy$))
      .subscribe((geneSelection: GeneTableSelection) => {
        this.handleGeneTableSelectionChange(geneSelection);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.geneTableSubscription) {
      this.geneTableSubscription.unsubscribe();
    }
  }

  private handleGeneTableSelectionChange(geneSelection: GeneTableSelection): void {
    if (!geneSelection.species) {
      return;
    }

    // Update selection
    const previousChain = this.selection.chain;
    const previousSpecies = this.selection.species;
    this.selection = {
      species: geneSelection.species,
      chain: geneSelection.commonDatasets.length > 0 ? geneSelection.commonDatasets[0] : null,
      asc: undefined // Always clear ASC when species/chain changes
    };

    // Update ASC dropdown if species or chain changed
    if (this.selection.species && this.selection.chain &&
        (this.selection.species !== previousSpecies || this.selection.chain !== previousChain)) {
      this.ascLoadSubject.next({species: this.selection.species, chain: this.selection.chain});
    } else if (!this.selection.chain) {
      this.disableAscDropdown();
    }
  }

  private loadAscs(species: string, chain: string): void {
    if (!species || !chain) {
      this.disableAscDropdown();
      return;
    }

    this.ascLoading = true;
    this.ascError = null;
    this.ascDisabled = true;
    this.availableAscs = [];

    this.refbookService.getAscsInLocusApi(species, chain)
      .pipe(
        catchError(err => {
          this.ascError = err.message || 'Failed to load ASCs';
          this.ascLoading = false;
          this.ascDisabled = true;
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((rec: { ascs: string[], genomic: boolean, airr_seq: boolean }) => {
        this.ascLoading = false;
        this.availableAscs = rec.ascs || [];
        this.genomic_present = rec.genomic;
        this.airrseq_present = rec.airr_seq;
        this.ascDisabled = this.availableAscs.length === 0;
        this.ascError = null;

        if (this.availableAscs.length > 0) {
          this.selection.asc = this.availableAscs[0];
          this.onAscChange();
        }
      });
  }

  private disableAscDropdown(): void {
    this.ascDisabled = true;
    this.availableAscs = [];
    this.ascLoading = false;
    this.ascError = null;
    this.selection.asc = undefined;
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
    // console.log(`Tab changed to index: ${event.index}`);
  }

  onAscChange(): void {
    // This method is called when ASC selection changes
    // The selection.asc is already updated by ngModel
    // No need to recreate the object - ngModel handles the update
    this.selection = { ...this.selection };
  }
}
