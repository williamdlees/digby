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

    // Map GeneTableSelection to SpeciesGeneSelection
    const mappedSelection = this.mapGeneTableToSpeciesGene(geneSelection);

    // Synchronize genomic and airr-seq loci (prefer airr-seq)
    const synchronizedSelection = this.synchronizeLoci(mappedSelection, geneSelection);

    // Update selection
    const previousChain = this.selection.chain;
    this.selection = {
      species: synchronizedSelection.species,
      chain: synchronizedSelection.chain,
      asc: undefined // Always clear ASC when species/chain changes
    };

    // Update ASC dropdown if species or chain changed
    if (this.selection.species && this.selection.chain &&
        (this.selection.species !== synchronizedSelection.species || this.selection.chain !== previousChain)) {
      this.ascLoadSubject.next({species: this.selection.species, chain: this.selection.chain});
    } else if (!this.selection.chain) {
      this.disableAscDropdown();
    }
  }

  private mapGeneTableToSpeciesGene(geneSelection: GeneTableSelection): SpeciesGeneSelection {
    return {
      species: geneSelection.species,
      chain: undefined, // Will be determined by synchronization logic
      asc: this.selection.asc // Preserve current ASC unless cleared
    };
  }

  private synchronizeLoci(baseSelection: SpeciesGeneSelection, geneSelection: GeneTableSelection): SpeciesGeneSelection {
    let selectedChain: string | undefined = undefined;

    // Prefer airr-seq chain, fallback to genomic chain
    if (geneSelection.repSeqs && geneSelection.repSeqs.length > 0) {
      selectedChain = geneSelection.repSeqs[0];
    } else if (geneSelection.datasets && geneSelection.datasets.length > 0) {
      selectedChain = geneSelection.datasets[0];
    }

    return {
      ...baseSelection,
      chain: selectedChain
    };
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
      .subscribe((ascs: string[]) => {
        this.ascLoading = false;
        this.availableAscs = ascs || [];
        this.ascDisabled = this.availableAscs.length === 0;
        this.ascError = null;
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
