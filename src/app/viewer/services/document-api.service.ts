import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentsAis, DocumentsLre, InterOpId, LreRequest } from '../models/document.models';

export const DOCUMENT_API_URL = new InjectionToken<string>('DOCUMENT_API_URL');

@Injectable({ providedIn: 'root' })
export class DocumentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(DOCUMENT_API_URL).replace(/\/+$/, '');

  getAis(demande: InterOpId | null, piecesJointesDemo = false): Observable<DocumentsAis> {
    return this.http.post<DocumentsAis>(`${this.baseUrl}/documents/ais`, demande, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
      params: { pj: piecesJointesDemo }
    });
  }

  getLre(demande: LreRequest): Observable<DocumentsLre> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries({
      'code-acam': demande.codeAcam,
      'id-lre': demande.idLre,
      'date-lre': demande.dateLre
    })) {
      // Une date absente est omise ; une date vide explicite reste validée par Quarkus.
      if (value !== undefined) params = params.set(key, value);
    }
    return this.http.get<DocumentsLre>(`${this.baseUrl}/documents/lre`, {
      withCredentials: true,
      params
    });
  }
}
