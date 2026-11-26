export interface DocumentPdf {
  id: number;
  nom: string | null;
  libelle: string | null;
  docId: string | null;
  contenu: string;
}

export interface InterOpId {
  nbId?: number;
  idFlux?: string[];
  cleDeclaration?: string;
  refDeclaration?: string;
  userId?: string;
  sessionId?: string;
  nomClient?: string;
  idSequence?: string;
  listePiecesJointes?: string[];
}

export interface DocumentsAis {
  declaration?: string | null;
  cle?: string | null;
  nomClient?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  idSequence?: string | null;
  listePiecesJointes?: string[] | null;
  documents: DocumentPdf[];
}

export interface LreRequest {
  codeAcam?: string;
  idLre?: string;
  dateLre?: string;
}

export interface DocumentsLre extends LreRequest {
  documents: DocumentPdf[];
}

export type ViewerRequest =
  | { mode: 'ais'; demande: InterOpId | null; piecesJointesDemo: boolean }
  | { mode: 'lre'; demande: LreRequest };

export interface ViewerError {
  title: string;
  cause: string;
  message: string;
  lre?: LreRequest;
  contactSupport: boolean;
}
