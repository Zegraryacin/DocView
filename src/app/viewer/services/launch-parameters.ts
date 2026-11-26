import type { InterOpId, ViewerRequest } from '../models/document.models';

function parseObject(value: string | null): Record<string, unknown> | null {
  if (!value?.trim()) return null;
  const parsed: unknown = JSON.parse(value);
  if (parsed === null) return null;
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Le paramètre JSON doit contenir un objet.');
  }
  return parsed as Record<string, unknown>;
}

function stringField(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error('Un paramètre de la demande est invalide.');
  return value;
}

export function parseLaunchParameters(fields: URLSearchParams): ViewerRequest {
  const mode = (fields.get('mode') ?? 'ais').toLowerCase();
  if (mode === 'denotresil' || mode === 'lre') {
    const json = parseObject(fields.get('jsonDemande')) ?? {};
    return {
      mode: 'lre',
      demande: {
        codeAcam: stringField(json['codeAcam'] ?? fields.get('code-acam') ?? fields.get('codeacam')),
        idLre: stringField(json['idLre'] ?? fields.get('id-lre') ?? fields.get('idlre')),
        dateLre: stringField(json['dateLRE'] ?? json['dateLre'] ?? fields.get('date-lre') ?? fields.get('date'))
      }
    };
  }
  // Comme ViewhandlerControler, les autres modes suivent le parcours AIS.
  return {
    mode: 'ais',
    demande: parseObject(fields.get('jsonDoc')) as InterOpId | null,
    piecesJointesDemo: fields.get('pj') === 'true'
  };
}

export function mergePostedParameters(query: URLSearchParams, posted: string | null): URLSearchParams {
  const fields = new URLSearchParams(query);
  const values = parseObject(posted);
  for (const [key, value] of Object.entries(values ?? {})) {
    if (typeof value !== 'string') throw new Error('Un champ du formulaire est invalide.');
    fields.set(key, value);
  }
  return fields;
}
