
// Material table column definitions

// This file is created programmatically by genomic_create_digby_panel_cols.py. DO NOT UPDATE BY HAND.

export const columnInfo = [

    {id: 'sample_name', name: 'Sample name', section: 'Sample', hidden: false, type: 'string', size: 'small-col', description: 'Sample name as allocated by VDJbase', example: ''},
    {id: 'subject_id', name: 'Subject ID', section: 'Subject', hidden: true, type: 'string', size: 'small-col', description: 'Subject ID assigned by submitter, unique within study', example: 'SUB856413'},
    {id: 'study_id', name: 'Study ID', section: 'Study', hidden: false, type: 'string', size: 'large-col', description: 'Unique ID assigned by study registry', example: 'PRJNA001'},
    {id: 'tissue_label', name: 'Tissue', section: 'TissuePro', hidden: false, type: 'string', size: 'small-col', description: 'Label of the concept in the respective ontology', example: ''},
    {id: 'annotation_path', name: 'Annotation reports', section: 'Sample', hidden: false, type: 'string', size: 'small-col', description: 'Reports produced during the annotation', example: ''},
    {id: 'ancestry_population', name: 'Ancestry population', section: 'Subject', hidden: false, type: 'string', size: 'small-col', description: 'Broad geographic origin of ancestry (continent)', example: 'list of continents, mixed or unknown'},
    {id: 'ethnicity', name: 'Ethnicity', section: 'Subject', hidden: false, type: 'string', size: 'small-col', description: 'Ethnic group of subject (defined as cultural/language-based membership)', example: 'English, Kurds, Manchu, Yakuts (and other fields from Wikipedia)'},
    {id: 'race', name: 'Race', section: 'Subject', hidden: false, type: 'string', size: 'small-col', description: 'Racial group of subject (as defined by NIH)', example: 'White, American Indian or Alaska Native, Black, Asian, Native Hawaiian or Other Pacific Islander, Other'},
    {id: 'repertoire_id', name: 'Repertoire ID', section: 'Sample', hidden: true, type: 'string', size: 'small-col', description: 'Identifier for the repertoire object. This identifier should be globally unique so that repertoires from multiple studies can be combined together without conflict. The repertoire_id is used to link other AIRR data to a Repertoire. Specifically, the Rearrangements Schema includes repertoire_id for referencing the specific Repertoire for that Rearrangement.', example: ''},
    {id: 'repertoire_name', name: 'Repertoire name', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'Short generic display name for the repertoire', example: ''},
    {id: 'repertoire_description', name: 'Repertoire description', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'Generic repertoire description', example: ''},
    {id: 'sample_processing_id', name: 'Sample processing ID', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'Identifier for the sample processing object. This field should be unique within the repertoire. This field can be used to uniquely identify the combination of sample, cell processing, nucleic acid processing and sequencing run information for the repertoire.', example: ''},
    {id: 'sample_id', name: 'Biological sample ID', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'Sample ID assigned by submitter, unique within study', example: 'SUP52415'},
    {id: 'sample_type', name: 'Sample type', section: 'Sample', hidden: true, type: 'string', size: 'small-col', description: 'The way the sample was obtained, e.g. fine-needle aspirate, organ harvest, peripheral venous puncture', example: 'Biopsy'},
    {id: 'tissue_id', name: 'Tissue ID', section: 'Sample', hidden: true, type: 'string', size: 'small-col', description: 'CURIE of the concept, encoding the ontology and the local ID', example: ''},
    {id: 'anatomic_site', name: 'Anatomic site', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'The anatomic location of the tissue, e.g. Inguinal, femur', example: 'Iliac crest'},
    {id: 'disease_state_sample', name: 'Disease state of sample', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'Histopathologic evaluation of the sample', example: 'Tumor infiltration'},
    {id: 'collection_time_point_relative', name: 'Sample collection time', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'Time point at which sample was taken, relative to `Collection time event`', example: '14'},
    {id: 'collection_time_point_relative_unit_id', name: 'Sample collection time unit', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'CURIE of the concept, encoding the ontology and the local ID', example: ''},
    {id: 'collection_time_point_relative_unit_label', name: 'Sample collection time unit', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'Label of the concept in the respective ontology', example: ''},
    {id: 'collection_time_point_reference', name: 'Collection time event', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'Event in the study schedule to which `Sample collection time` relates to', example: 'Primary vaccination'},
    {id: 'biomaterial_provider', name: 'Biomaterial provider', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'Name and address of the entity providing the sample', example: 'Tissues-R-Us, Tampa, FL, USA'},
    {id: 'sequencing_run_id', name: 'Batch number', section: 'Sample', hidden: true, type: 'string', size: 'small-col', description: 'ID of sequencing run assigned by the sequencing facility', example: '160101_M01234'},
    {id: 'total_reads_passing_qc_filter', name: 'Total reads passing QC filter', section: 'Sample', hidden: true, type: 'string', size: 'small-col', description: 'Number of usable reads for analysis', example: '10365118'},
    {id: 'sequencing_run_date', name: 'Date of sequencing run', section: 'Sample', hidden: true, type: 'string', size: 'small-col', description: 'Date of sequencing run', example: '16/12/2016'},
    {id: 'file_type', name: 'Raw sequencing data file type', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'File format for the raw reads or sequences', example: ''},
    {id: 'filename', name: 'Raw sequencing data file name', section: 'Sample', hidden: true, type: 'string', size: 'large-col', description: 'File name for the raw reads or sequences. The first file in paired-read sequencing.', example: 'MS10R-NMonson-C7JR9_S1_R1_001.fastq'},
    {id: 'annotation_method', name: 'Annotation Method', section: 'Sample', hidden: true, type: 'string', size: 'small-col', description: 'Name of the annotation method', example: 'Igenotyper'},
    {id: 'annotation_reference', name: 'Annotation Ref', section: 'Sample', hidden: true, type: 'string', size: 'small-col', description: 'Citation for annotation method', example: 'https://www.frontiersin.org/article/10.3389/fimmu.2020.02136'},
    {id: 'contig_bam_path', name: 'Contig Path', section: 'Sample', hidden: true, type: 'string', size: 'small-col', description: 'Path to the contig file on the server', example: ''},
    {id: 'reference_assembly', name: 'Reference assembly', section: 'Sample', hidden: true, type: 'string', size: 'small-col', description: 'Name of reference assembly', example: ''},
    {id: 'study_title', name: 'Study title', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Descriptive study title', example: 'Effects of sun light exposure of the Treg repertoire'},
    {id: 'study_type_id', name: 'Study type ID', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'CURIE of the concept, encoding the ontology and the local ID', example: ''},
    {id: 'study_type_label', name: 'Study type', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Label of the concept in the respective ontology', example: ''},
    {id: 'study_description', name: 'Study description', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Generic study description', example: 'Longer description'},
    {id: 'inclusion_exclusion_criteria', name: 'Inclusion/exclusion criteria', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'List of criteria for inclusion/exclusion for the study', example: 'Include: Clinical P. falciparum infection; Exclude: Seropositive for HIV'},
    {id: 'grants', name: 'Grant funding agency', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Funding agencies and grant numbers', example: 'NIH, award number R01GM987654'},
    {id: 'study_contact', name: 'Contact information (study)', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Full contact information of the contact persons for this study This should include an e-mail address and a persistent identifier such as an ORCID ID.', example: 'Dr. P. Stibbons, p.stibbons@unseenu.edu, https://orcid.org/0000-0002-1825-0097'},
    {id: 'collected_by', name: 'Contact  (data collection)', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Full contact information of the data collector, i.e. the person who is legally responsible for data collection and release. This should include an e-mail address.', example: 'Dr. P. Stibbons, p.stibbons@unseenu.edu'},
    {id: 'lab_name', name: 'Lab name', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Department of data collector', example: 'Department for Planar Immunology'},
    {id: 'lab_address', name: 'Lab address', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Institution and institutional address of data collector', example: 'School of Medicine, Unseen University, Ankh-Morpork, Disk World'},
    {id: 'submitted_by', name: 'Contact  (data deposition)', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Full contact information of the data depositor, i.e. the person submitting the data to a repository. This is supposed to be a short-lived and technical role until the submission is relased.', example: 'Adrian Turnipseed, a.turnipseed@unseenu.edu'},
    {id: 'pub_ids', name: 'Relevant publications', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Publications describing the rationale and/or outcome of the study', example: 'PMID:85642'},
    {id: 'keywords_study', name: 'Keywords for study', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: '', example: ''},
    {id: 'adc_publish_date', name: 'ADC Publish Date', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Date the study was first published in the AIRR Data Commons.', example: '02/02/2021'},
    {id: 'adc_update_date', name: 'ADC Update Date', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'Date the study data was updated in the AIRR Data Commons.', example: '02/02/2021'},
    {id: 'num_subjects', name: 'Subjects', section: 'Study', hidden: true, type: 'integer', size: 'small-col', description: 'Number of subjects in the study', example: ''},
    {id: 'num_samples', name: 'Samples', section: 'Study', hidden: true, type: 'integer', size: 'small-col', description: 'Number of samples in the study', example: ''},
    {id: 'accession_reference', name: 'Study Ref', section: 'Study', hidden: true, type: 'string', size: 'large-col', description: 'URL of the study in the registry', example: ''},
    {id: 'study_name', name: 'Study name', section: 'Study', hidden: true, type: 'string', size: 'small-col', description: 'Study name', example: ''},
    {id: 'synthetic', name: 'Synthetic library', section: 'Subject', hidden: true, type: 'boolean', size: 'large-col', description: 'TRUE for libraries in which the diversity has been synthetically generated (e.g. phage display)', example: ''},
    {id: 'species_id', name: 'Species ID', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'CURIE of the concept, encoding the ontology and the local ID', example: ''},
    {id: 'species_label', name: 'Species', section: 'Subject', hidden: true, type: 'string', size: 'small-col', description: 'Label of the concept in the respective ontology', example: ''},
    {id: 'organism_id', name: 'Organism ID', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'CURIE of the concept, encoding the ontology and the local ID', example: ''},
    {id: 'organism_label', name: 'Organism', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Label of the concept in the respective ontology', example: ''},
    {id: 'sex', name: 'Sex', section: 'Subject', hidden: true, type: 'string', size: 'small-col', description: 'Biological sex of subject', example: 'female'},
    {id: 'age_min', name: 'Age minimum', section: 'Subject', hidden: true, type: 'number', size: 'small-col', description: 'Specific age or lower boundary of age range.', example: '60'},
    {id: 'age_max', name: 'Age maximum', section: 'Subject', hidden: true, type: 'number', size: 'small-col', description: 'Upper boundary of age range or equal to age_min for specific age. This field should only be null if age_min is null.', example: '80'},
    {id: 'age_unit_id', name: 'Age unit ID', section: 'Subject', hidden: true, type: 'string', size: 'small-col', description: 'CURIE of the concept, encoding the ontology and the local ID', example: ''},
    {id: 'age_unit_label', name: 'Age unit', section: 'Subject', hidden: true, type: 'string', size: 'small-col', description: 'Label of the concept in the respective ontology', example: ''},
    {id: 'age_event', name: 'Age event', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Event in the study schedule to which `Age` refers. For NCBI BioSample this MUST be `sampling`. For other implementations submitters need to be aware that there is currently no mechanism to encode to potential delta between `Age event` and `Sample collection time`, hence the chosen events should be in temporal proximity.', example: 'enrollment'},
    {id: 'age', name: 'Age', section: 'Subject', hidden: true, type: 'string', size: 'small-col', description: '', example: ''},
    {id: 'strain_name', name: 'Strain name', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Non-human designation of the strain or breed of animal used', example: 'C57BL/6J'},
    {id: 'linked_subjects', name: 'Relation to other subjects', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Subject ID to which `Relation type` refers', example: 'SUB1355648'},
    {id: 'link_type', name: 'Relation type', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Relation between subject and `linked_subjects`, can be genetic or environmental (e.g.exposure)', example: 'father, daughter, household'},
    {id: 'study_group_description', name: 'Study group description', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Designation of study arm to which the subject is assigned to', example: 'control'},
    {id: 'disease_diagnosis_id', name: 'Diagnosis ID', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'CURIE of the concept, encoding the ontology and the local ID', example: ''},
    {id: 'disease_diagnosis_label', name: 'Diagnosis', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Label of the concept in the respective ontology', example: ''},
    {id: 'disease_length', name: 'Length of disease', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Time duration between initial diagnosis and current intervention', example: '23 months'},
    {id: 'disease_stage', name: 'Disease stage', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Stage of disease at current intervention', example: 'Stage II'},
    {id: 'prior_therapies', name: 'Prior therapies', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'List of all relevant previous therapies applied to subject for treatment of `Diagnosis`', example: 'melphalan/prednisone'},
    {id: 'immunogen', name: 'Immunogen/agent', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Antigen, vaccine or drug applied to subject at this intervention', example: 'bortezomib'},
    {id: 'intervention', name: 'Intervention definition', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Description of intervention', example: 'systemic chemotherapy, 6 cycles, 1.25 mg/m2'},
    {id: 'medical_history', name: 'Other relevant medical history', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Medical history of subject that is relevant to assess the course of disease and/or treatment', example: 'MGUS, first diagnosed 5 years prior'},
    {id: 'genotype_process', name: 'Genotype acquisition process', section: 'Subject', hidden: true, type: 'string', size: 'large-col', description: 'Information on how the genotype was acquired. Controlled vocabulary.', example: 'repertoire_sequencing'},
    {id: 'patient_name', name: 'Subject name', section: 'Subject', hidden: true, type: 'string', size: 'small-col', description: 'Subject name as allocated by VDJbase', example: ''},
    {id: 'mother_in_study', name: 'Mother in study', section: 'Subject', hidden: true, type: 'string', size: 'small-col', description: 'Accession number of mother, if included in this study', example: 'ABC123'},
    {id: 'father_in_study', name: 'Father in study', section: 'Subject', hidden: true, type: 'string', size: 'small-col', description: 'Accession number of father, if included in this study', example: ''},
    {id: 'tissue_processing', name: 'Tissue processing', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'Enzymatic digestion and/or physical methods used to isolate cells from sample', example: 'Collagenase A/Dnase I digested, followed by Percoll gradient'},
    {id: 'cell_subset_id', name: 'Cell subset ID', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'CURIE of the concept, encoding the ontology and the local ID', example: ''},
    {id: 'cell_subset_label', name: 'Cell subset', section: 'TissuePro', hidden: true, type: 'string', size: 'small-col', description: 'Label of the concept in the respective ontology', example: ''},
    {id: 'cell_phenotype', name: 'Cell subset phenotype', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'List of cellular markers and their expression levels used to isolate the cell population', example: 'CD19+ CD38+ CD27+ IgM- IgD-'},
    {id: 'cell_species_id', name: 'Cell species ID', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'CURIE of the concept, encoding the ontology and the local ID', example: ''},
    {id: 'cell_species_label', name: 'Cell species', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'Label of the concept in the respective ontology', example: ''},
    {id: 'single_cell', name: 'Single-cell sort', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'TRUE if single cells were isolated into separate compartments', example: ''},
    {id: 'cell_number', name: 'Number of cells in experiment', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'Total number of cells that went into the experiment', example: '1000000'},
    {id: 'cells_per_reaction', name: 'Cells per  replicate', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'Number of cells for each biological replicate', example: '50000'},
    {id: 'cell_storage', name: 'Cell storage', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'TRUE if cells were cryo-preserved between isolation and further processing', example: 'TRUE'},
    {id: 'cell_quality', name: 'Cell quality', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'Relative amount of viable cells after preparation and (if applicable) thawing', example: '90% viability as determined by 7-AAD'},
    {id: 'cell_isolation', name: 'Isolation / enrichment', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'Description of the procedure used for marker-based isolation or enrich cells', example: 'Cells were stained with fluorochrome labeled antibodies and then sorted on a FlowMerlin (CE) cytometer.'},
    {id: 'cell_processing_protocol', name: 'Processing protocol', section: 'TissuePro', hidden: true, type: 'string', size: 'large-col', description: 'Description of the methods applied to the sample including cell preparation/ isolation/enrichment and nucleic acid extraction. This should closely mirror the Materials and methods section in the manuscript.', example: 'Stimulated wih anti-CD3/anti-CD28'},
    {id: 'template_class', name: 'Target substrate', section: 'SeqProtocol', hidden: true, type: 'string', size: 'small-col', description: 'The class of nucleic acid that was used as primary starting material for the following procedures', example: 'RNA'},
    {id: 'template_quality', name: 'Target substrate quality', section: 'SeqProtocol', hidden: true, type: 'string', size: 'large-col', description: 'Description and results of the quality control performed on the template material', example: 'RIN 9.2'},
    {id: 'template_amount', name: 'Template amount', section: 'SeqProtocol', hidden: true, type: 'string', size: 'large-col', description: 'Amount of template that went into the process', example: '1000'},
    {id: 'template_amount_unit_id', name: 'Template amount unit ID', section: 'SeqProtocol', hidden: true, type: 'string', size: 'large-col', description: 'CURIE of the concept, encoding the ontology and the local ID', example: ''},
    {id: 'template_amount_unit_label', name: 'Template amount unit', section: 'SeqProtocol', hidden: true, type: 'string', size: 'large-col', description: 'Label of the concept in the respective ontology', example: ''},
    {id: 'library_generation_method', name: 'Library generation method', section: 'SeqProtocol', hidden: true, type: 'string', size: 'large-col', description: 'Generic type of library generation', example: 'RT(oligo-dT)+TS(UMI)+PCR'},
    {id: 'library_generation_protocol', name: 'Library generation protocol', section: 'SeqProtocol', hidden: true, type: 'string', size: 'large-col', description: 'Description of processes applied to substrate to obtain a library that is ready for sequencing', example: 'cDNA was generated using'},
    {id: 'library_generation_kit_version', name: 'Protocol IDs', section: 'SeqProtocol', hidden: true, type: 'string', size: 'large-col', description: 'When using a library generation protocol from a commercial provider, provide the protocol version number', example: 'v2.1 (2016-09-15)'},
    {id: 'pcr_target_locus', name: 'Target locus for PCR', section: 'SeqProtocol', hidden: true, type: 'string', size: 'small-col', description: 'Designation of the target locus. Note that this field uses a controlled vocubulary that is meant to provide a generic classification of the locus, not necessarily the correct designation according to a specific nomenclature.', example: 'IGK'},
    {id: 'sequencing_platform', name: 'Sequencing platform', section: 'SeqProtocol', hidden: true, type: 'string', size: 'large-col', description: 'Designation of sequencing instrument used', example: 'Alumina LoSeq 1000'},
    {id: 'sequencing_facility', name: 'Sequencing facility', section: 'SeqProtocol', hidden: true, type: 'string', size: 'large-col', description: 'Name and address of sequencing facility', example: 'Seqs-R-Us, Vancouver, BC, Canada'},
    {id: 'sequencing_kit', name: 'Sequencing kit', section: 'SeqProtocol', hidden: true, type: 'string', size: 'large-col', description: 'Name, manufacturer, order and lot numbers of sequencing kit', example: 'FullSeq 600, Alumina, #M123456C0, 789G1HK'},
    {id: 'data_processing_id', name: 'Data processing ID', section: 'DataPro', hidden: true, type: 'string', size: 'large-col', description: 'Identifier for the data processing object.', example: ''},
    {id: 'primary_annotation', name: 'Primary annotation', section: 'DataPro', hidden: true, type: 'string', size: 'large-col', description: 'If true, indicates this is the primary or default data processing for the repertoire and its rearrangements. If false, indicates this is a secondary or additional data processing.', example: ''},
    {id: 'software_versions', name: 'Software tools', section: 'DataPro', hidden: true, type: 'string', size: 'large-col', description: 'Version number and / or date, include company pipelines', example: 'IgBLAST 1.6'},
    {id: 'quality_thresholds', name: 'Quality thresholds', section: 'DataPro', hidden: true, type: 'string', size: 'large-col', description: 'How sequences were removed from (4) based on base quality scores', example: 'Average Phred score >=20'},
    {id: 'data_processing_protocols', name: 'Data processing protocols', section: 'DataPro', hidden: true, type: 'string', size: 'large-col', description: 'General description of how QC is performed', example: 'Data was processed using [...]'},
    {id: 'data_processing_files', name: 'Processed data file names', section: 'DataPro', hidden: true, type: 'string', size: 'large-col', description: '', example: ''},
    {id: 'germline_database', name: 'V(D)J germline reference', section: 'DataPro', hidden: true, type: 'string', size: 'large-col', description: 'Source of germline V(D)J genes with version number or date accessed.', example: 'ENSEMBL, Homo sapiens build 90, 2017-10-01'},
    {id: 'analysis_provenance_id', name: 'Analysis provenance ID', section: 'DataPro', hidden: true, type: 'string', size: 'large-col', description: 'Identifier for machine-readable PROV model of analysis provenance', example: ''},

]
