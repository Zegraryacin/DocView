import type { LreRequest, ViewerError } from '../models/document.models';

type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject : {};
}
function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function toViewerError(status: number, payload: unknown, lre?: LreRequest): ViewerError {
  const body = object(payload);
  const messages = body['messages'];
  const entry = Array.isArray(messages) ? object(messages[0]) : object(body['message']);
  const code = text(body['code']) || text(entry['code']);
  const messagesByCode: Record<string, string> = {
    LRE_PURGEE: 'LRE purgée — aucune consultation possible.',
    LRE_ARCHIVEE: 'LRE archivée — demander le désarchivage auprès d’Artel.',
    LRE_DATE_INVALIDE: 'La date du courrier est invalide.',
    PARAMETRE_ABSENT: 'Un paramètre de la demande est absent. Veuillez relancer la demande.'
  };
  const documentAbsent = !!lre && ['LRE_PURGEE', 'LRE_ARCHIVEE'].includes(code);
  const authentication = status === 401 || status === 403;
  const message = text(entry['libelle']) || text(entry['message']) || text(body['libelle']) || text(body['message']);
  const error: ViewerError = {
    title: documentAbsent ? 'Document non disponible' : 'Document Viewer indisponible',
    cause: code,
    message: message || messagesByCode[code] || 'La demande a échoué. Veuillez la relancer.',
    lre: documentAbsent ? lre : undefined,
    contactSupport: !documentAbsent
  };
  if (authentication) {
    error.cause = 'Authentification';
    error.message = status === 401 ? 'Votre session est absente ou expirée.' : 'Vous ne disposez pas des droits pour consulter ces documents.';
  } else if (status === 0) {
    error.message = 'Le service de documents est inaccessible.';
  }
  return error;
}
