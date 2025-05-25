export class SpeciesGeneSelection {
  species: string;
  chain: string;
  asc: string;
}

export class AvailableSpeciesAndData {
  species: string[];
  chains: Record<string, string[]>;
}

export const testAvailableSpeciesAndData: AvailableSpeciesAndData = {
  species: ['Human', 'Mouse', 'Rat'],
  chains: {
    Human: ['IGHV', 'IGHD', 'IGHJ', 'IGKV', 'IGKJ', 'IGLV', 'IGLJ'],
    Mouse: ['IGHV', 'IGHD', 'IGHJ', 'IGKV', 'IGKJ', 'IGLV', 'IGLJ'],
    Rat: ['IGKV', 'IGKJ', 'IGLV', 'IGLJ']
  }
};