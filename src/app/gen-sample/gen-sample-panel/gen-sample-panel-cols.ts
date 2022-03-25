 export const columnInfo = [
   {id: 'identifier', name: 'Identifier', hidden: false, type: 'string', size: 'small-col', description: 'VDJbase identifier'},
   {id: 'name_in_study', name: 'Name in Study', hidden: true, type: 'string', size: 'small-col', description: 'Name or identifier of subject used on original study'},
   {id: 'age', name: 'Age', hidden: true, type: 'number', size: 'small-col', description: 'Subject age at time of study'},
   {id: 'sex', name: 'Sex', hidden: true, type: 'string', size: 'small-col', description: 'Subject sex'},
   {id: 'ethnicity', name: 'Ethnicity', hidden: true, type: 'string', size: 'small-col', description: 'Declared ethnicity'},
   {id: 'sequencing_platform', name: 'Sequencing Platform', hidden: true, type: 'string', size: 'small-col', description: 'Sequencing platform used with this sample'},
   {id: 'capture_probes', name: 'Capture Probes', hidden: true, type: 'string', size: 'small-col', description: 'Version of capture probes used with this sample'},
   {id: 'annotation_path', name: 'Report', hidden: false, type: 'string', size: 'small-col', description: 'Annotation report'},
   {id: 'annotation_method', name: 'Annotation Method', hidden: false, type: 'string', size: 'large-col', description: 'Tool used for annotaiton'},
   {id: 'annotation_format', name: 'Annotation Format', hidden: true, type: 'number', size: 'small-col', description: 'Subject age at time of study'},
   {id: 'annotation_reference', name: 'Annotation Ref', hidden: true, type: 'string', size: 'small-col', description: 'Format of annotation report'},
   {id: 'study_name', name: 'Study Name', hidden: false, type: 'string', size: 'large-col', description: 'Name of the study as used by the authors'},
   {id: 'study_date', name: 'Study Date', hidden: false, type: 'string', size: 'small-col', description: 'Date of the study'},
   {id: 'study_description', name: 'Study Description', hidden: false, type: 'string', size: 'large-col', description: 'Brief description of the study'},
   {id: 'institute', name: 'Institute', hidden: false, type: 'string', size: 'large-col', description: 'Institution issuing the study'},
   {id: 'researcher', name: 'Researcher', hidden: true, type: 'string', size: 'large-col', description: 'Researcher issuing the study'},
   {id: 'contact', name: 'Contact', hidden: true, type: 'string', size: 'large-col', description: 'Contact name for the study'},
   {id: 'reference', name: 'Reference', hidden: true, type: 'string', size: 'large-col', description: 'Link to reference for the study'},
   {id: 'dataset', name: 'Dataset', hidden: true, type: 'string', size: 'small-col', description: 'The dataset in which the allele was determined'},
   {id: 'IGHV4_59_coverage', name: 'IGHV4-59 Coverage', hidden: true, type: 'number', size: 'small-col', description: 'IGHV4-59 Coverage'},
   {id: 'IGHV4_59_coverage_var', name: 'IGHV4-59 Coverage Variance', hidden: true, type: 'number', size: 'small-col', description: 'IGHV4-59 Coverage variance'},
   {id: 'IGH_coverage', name: 'IGH Coverage', hidden: true, type: 'number', size: 'small-col', description: 'IGH coverage'},
 ];
