export * from './genomic.service';
import { GenomicService } from './genomic.service';
export * from './repseq.service';
import { RepseqService } from './repseq.service';
export const APIS = [GenomicService, RepseqService];
