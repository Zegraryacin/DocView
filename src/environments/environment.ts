import { Environment } from './environment.interfaces';

// Dans CAP-UP, le fournisseur DOCUMENT_API_URL utilise l'environnement CoveUse existant.
const config = (window as Window & { COVEUSE_CONFIG?: Partial<Environment> }).COVEUSE_CONFIG;
export const environment: Environment = {
  apiBack: config?.apiBack ?? '/api'
};
