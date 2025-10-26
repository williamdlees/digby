export class GeneTableSelection {
  species: string;
  datasets: string[];
  genDatasetDescriptions: { dataset: string, description: string}[];
  assemblies: string[];
  repSeqs: string[];
  repDatasetDescriptions: { dataset: string, description: string}[];
  commonDatasets: string[];
}
