import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { DocumentApiService } from './services/document-api.service';
import { mergePostedParameters, parseLaunchParameters } from './services/launch-parameters';
import { toViewerError } from './services/viewer-errors';
import { DocumentPdf, DocumentsAis, DocumentsLre, ViewerError, ViewerRequest } from './models/document.models';

type LoadResult = { data: DocumentsAis | DocumentsLre } | { error: ViewerError };

@Component({
  selector: 'app-viewer',
  standalone: false,
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.scss'
})
export class ViewerComponent implements OnInit {
  private readonly api = inject(DocumentApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  documents: DocumentPdf[] = [];
  selected: DocumentPdf | null = null;
  ais: DocumentsAis | null = null;
  error: ViewerError | null = null;
  loading = true;
  notice = '';
  secondaryScreen = this.document.cookie.split(';').some(cookie => cookie.trim() === 'nbEcrans=2');

  ngOnInit(): void {
    const postedElement = this.document.getElementById('viewer-launch');
    let posted = postedElement?.textContent ?? null;
    postedElement?.remove();

    this.route.queryParamMap.pipe(
      switchMap(params => {
        this.loading = true;
        this.error = null;
        this.documents = [];
        this.selected = null;
        this.ais = null;
        this.notice = '';
        const query = new URLSearchParams();
        for (const key of params.keys) query.set(key, params.get(key) ?? '');
        try {
          const launch = parseLaunchParameters(mergePostedParameters(query, posted));
          posted = null;
          return this.load(launch);
        } catch {
          posted = null;
          return of<LoadResult>({ error: {
            title: 'Document Viewer indisponible',
            cause: 'Paramètres de lancement',
            message: 'Les paramètres transmis à la consultation sont illisibles.',
            contactSupport: true
          } });
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.loading = false;
      if ('error' in result) {
        this.error = result.error;
        return;
      }
      this.documents = result.data.documents ?? [];
      this.selected = this.documents[0] ?? null;
    });
  }

  private load(launch: ViewerRequest): Observable<LoadResult> {
    const call: Observable<DocumentsAis | DocumentsLre> = launch.mode === 'ais'
      ? this.api.getAis(launch.demande, launch.piecesJointesDemo)
      : this.api.getLre(launch.demande);
    return call.pipe(
      map(data => {
        if (launch.mode === 'ais') this.ais = data as DocumentsAis;
        return { data };
      }),
      catchError((error: HttpErrorResponse) => of({
        error: toViewerError(error.status, error.error, launch.mode === 'lre' ? launch.demande : undefined)
      }))
    );
  }

  selectDocument(document: DocumentPdf): void {
    this.selected = document;
    this.notice = '';
  }

  toggleScreen(): void {
    this.secondaryScreen = !this.secondaryScreen;
    this.document.cookie = `nbEcrans=${this.secondaryScreen ? '2' : '1'}; Path=/; SameSite=Lax`;
  }

  showAttachments(): void {
    try {
      const opener = this.document.defaultView?.opener as Window | null;
      if (!opener || opener.closed) throw new Error('Fenêtre appelante absente');
      opener.dispatchEvent(new CustomEvent('afficher-document-list', {
        detail: { idDocumentList: this.ais?.listePiecesJointes ?? [] }
      }));
    } catch {
      this.notice = 'La fenêtre appelante est indisponible. Ouvrez les pièces jointes depuis cette application.';
    }
  }
}
