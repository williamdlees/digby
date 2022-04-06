 export const columnInfo = [
   {id: 'name', name: 'Name', hidden: false, type: 'string', size: 'large-col', description: 'Allele name (reference allele name with SNPs in VDJbase format)'},
   {id: 'imgt_name', name: 'IMGT Name', hidden: false, type: 'string', size: 'large-col', description: 'Corresponding IMGT name, if any'},
   {id: 'type', name: 'Type', hidden: false, type: 'string', size: 'small-col', description: 'Type of gene (V, D, J, C) or element'},
   {id: 'novel', name: 'Novel', hidden: false, type: 'boolean', size: 'small-col', description: 'True if this allele is not in the reference set used by the pipeline'},
   {id: 'functional', name: 'Functional', hidden: false, type: 'string', size: 'small-col', description: 'True if the gene or element matches canonical/expected functional characteristics'},
   {id: 'notes', name: 'Notes', hidden: false, type: 'string', size: 'small-col', description: 'Notes on functionality'},
   {id: 'deleted', name: 'Deleted', hidden: false, type: 'boolean', size: 'small-col', description: 'True if is record indicates that the associated gene is deleted in the corresponding haplotypes'},
   {id: 'sequence', name: 'Sequence', hidden: false, type: 'string', size: 'small-col', description: 'Sequence of the allele (click to display)'},
   {id: 'gapped_sequence', name: 'Gapped', hidden: true, type: 'string', size: 'small-col', description: 'IMGT-gapped sequence of the allele (click to display)'},
   {id: 'appearances', name: 'Appearances', hidden: false, type: 'integer', size: 'small-col', description: 'Number of subjects in which the allele has been inferred (click for list)'},
   {id: 'dataset', name: 'Dataset', hidden: true, type: 'string', size: 'small-col', description: 'The dataset in which the allele was determined'},
];
