 export const columnInfo = [
   {id: 'name', name: 'Name', hidden: false, type: 'string', size: 'large-col', description: 'Allele name (reference allele name with SNPs in VDJbase format)'},
   {id: 'gene_name', name: 'Gene Name', hidden: true, type: 'string', size: 'large-col', description: 'Reference gene name'},
   {id: 'pipeline_name', name: 'Pipeline Alias', hidden: true, type: 'string', size: 'large-col', description: 'Processing pipeline name'},
   {id: 'seq', name: 'Sequence', hidden: false, type: 'string', size: 'small-col', description: 'Sequence (click to see in full)'},
   {id: 'seq_len', name: 'Seq Length', hidden: false, type: 'integer', size: 'small-col', description: 'Sequence length'},
   {id: 'similar', name: 'Similar', hidden: false, type: 'string', size: 'large-col', description: 'Names of any other alleles with identical sequence'},
   {id: 'appears', name: 'Appearances', hidden: false, type: 'integer', size: 'small-col', description: 'Number of subjects in which the allele has been inferred (click for list)'},
   {id: 'is_single_allele', name: 'Single Allele', hidden: false, type: 'boolean', size: 'small-col', description: 'True if no other alleles in the reference set have the same sequence'},
   {id: 'low_confidence', name: 'Low Confidence', hidden: false, type: 'boolean', size: 'small-col', description: 'True if the inference of this allele has low confidence markers (see notes)'},
   {id: 'novel', name: 'Novel', hidden: false, type: 'boolean', size: 'small-col', description: 'True if this allele is not in the reference set used by the pipeline'},
   {id: 'max_kdiff', name: 'Max kDiff', hidden: false, type: 'number', size: 'small-col', description: 'The maximum kdiff value with which this allele was inferred, amongst the samples in which it was found'},
   {id: 'dataset', name: 'Dataset', hidden: false, type: 'string', size: 'small-col', description: 'The dataset in which the allele was determined'},
   {id: 'notes_count', name: 'Notes', hidden: false, type: 'integer', size: 'small-col', description: 'The number of notes raised for this allele across all samples in which it was found (click for list)'},
];
