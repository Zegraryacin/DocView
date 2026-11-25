import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { bootstrapApplication, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface DocumentPdf { id: number; nom: string; libelle: string; docId: string; contenu: string }
interface Dossier {
  documents: DocumentPdf[];
  sessionId?: string; nomClient?: string; declaration?: string; cle?: string;
  idSequence?: string; listePiecesJointes?: string[];
}

@Component({selector: 'doc-viewer', standalone: true, templateUrl: './viewer.html'})
export class Viewer implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private request?: Subscription;
  private blobUrl = '';
  pdf: SafeResourceUrl | null = null;
  dossier?: Dossier;
  selected?: DocumentPdf;
  title = '';
  detail = '';
  notice = '';
  lre = false;
  documentAbsent = false;
  acam = ''; identifiant = ''; date = '';
  secondaire = document.cookie.split(';').some(c => c.trim() === 'nbEcrans=2');

  ngOnInit() {
    // Le serveur de compatibilité injecte les champs POST sous forme de JSON inerte.
    try {
      const posted = document.getElementById('viewer-launch')?.textContent;
      const fields = posted ? new URLSearchParams(JSON.parse(posted)) : new URLSearchParams(location.search);
      this.lre = ['denotresil','lre'].includes((fields.get('mode') || '').toLowerCase());
      const options = {withCredentials: true};
      let call;
      if (this.lre) {
        const data = JSON.parse(fields.get('jsonDemande') || '{}');
        this.acam = data.codeAcam ?? fields.get('code-acam') ?? fields.get('codeacam') ?? '';
        this.identifiant = data.idLre ?? fields.get('id-lre') ?? fields.get('idlre') ?? '';
        this.date = data.dateLRE ?? data.dateLre ?? fields.get('date-lre') ?? fields.get('date') ?? '';
        const params: Record<string,string> = {};
        if (this.acam) params['code-acam'] = this.acam;
        if (this.identifiant) params['id-lre'] = this.identifiant;
        if (this.date) params['date-lre'] = this.date;
        call = this.http.get<Dossier>('/documents/lre', {...options, params});
      } else {
        const body = JSON.parse(fields.get('jsonDoc') || 'null');
        call = this.http.post<Dossier>('/documents/ais', body, {...options, headers:{'Content-Type':'application/json'}, params:{pj:fields.get('pj') === 'true'}});
      }
      this.request = call.subscribe({
        next: dossier => {
          if (!dossier?.documents?.length) { this.fail('Document non disponible', 'Aucun document à afficher.'); return; }
          this.dossier = dossier;
          this.open(dossier.documents[0]);
        },
        error: (e: HttpErrorResponse) => this.apiError(e)
      });
    } catch { this.fail('Document Viewer indisponible', 'Les paramètres de lancement sont illisibles.'); }
  }

  open(doc: DocumentPdf) {
    this.release();
    this.selected = doc;
    this.notice = '';
    try {
      const binary = atob(doc.contenu);
      if (!binary.slice(0,1024).includes('%PDF-')) throw new Error();
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      this.blobUrl = URL.createObjectURL(new Blob([bytes], {type:'application/pdf'}));
      this.pdf = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl);
    } catch { this.notice = 'Le contenu de ce PDF est illisible.'; }
  }
  toggleScreen() {
    this.secondaire = !this.secondaire;
    document.cookie = 'nbEcrans=' + (this.secondaire ? '2' : '1') + '; Path=/; SameSite=Lax';
  }
  attachments() {
    try {
      if (!window.opener || window.opener.closed) throw new Error();
      window.opener.dispatchEvent(new CustomEvent('afficher-document-list', {
        detail: {idDocumentList: this.dossier?.listePiecesJointes ?? []}
      }));
    } catch { this.notice = 'Les pièces jointes sont accessibles depuis l’application appelante.'; }
  }
  private apiError(e: HttpErrorResponse) {
    const payload = e.error;
    const info = payload?.messages?.[0] ?? payload?.message ?? payload;
    const code = payload?.code ?? info?.code;
    this.documentAbsent = this.lre && ['LRE_PURGEE','LRE_ARCHIVEE'].includes(code);
    const labels: Record<string,string> = {
      LRE_PURGEE:'LRE purgée — aucune consultation possible.',
      LRE_ARCHIVEE:'LRE archivée — demander le désarchivage auprès d’Artel.',
      LRE_DATE_INVALIDE:'La date du courrier est invalide.',
      PARAMETRE_ABSENT:'Un paramètre de la demande est absent.'
    };
    if ([401,403].includes(e.status)) {
      this.fail('Document Viewer indisponible', e.status === 401 ? 'Authentification requise.' : 'Accès refusé.');
      return;
    }
    const reason = info?.libelle ?? info?.message ?? (typeof info === 'string' && !info.trim().startsWith('<') ? info : undefined);
    this.fail(this.documentAbsent ? 'Document non disponible' : 'Document Viewer indisponible',
      (typeof reason === 'string' && reason) || labels[code] || 'La demande a échoué. Veuillez la relancer.');
  }
  private fail(title: string, detail: string) { this.title = title; this.detail = detail; }
  private release() { this.pdf = null; if (this.blobUrl) URL.revokeObjectURL(this.blobUrl); this.blobUrl = ''; }
  ngOnDestroy() { this.request?.unsubscribe(); this.release(); }
}
bootstrapApplication(Viewer, {providers:[provideHttpClient()]}).catch(console.error);
