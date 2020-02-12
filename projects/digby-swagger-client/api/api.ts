export * from './genomic.service';
import { GenomicService } from './genomic.service';
export * from './imgtimgtGeneTable.service';
import { ImgtimgtGeneTableService } from './imgtimgtGeneTable.service';
export * from './longReadsubmittedSequences.service';
import { LongReadsubmittedSequencesService } from './longReadsubmittedSequences.service';
export const APIS = [GenomicService, ImgtimgtGeneTableService, LongReadsubmittedSequencesService];
