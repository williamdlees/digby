export * from './genomic.service';
import { GenomicService } from './genomic.service';
export * from './reports.service';
import { ReportsService } from './reports.service';
export * from './repseq.service';
import { RepseqService } from './repseq.service';
export const APIS = [GenomicService, ReportsService, RepseqService];
