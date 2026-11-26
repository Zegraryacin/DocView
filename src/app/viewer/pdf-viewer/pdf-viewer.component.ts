import { Component, inject, Input, OnChanges, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentPdf } from '../models/document.models';

@Component({
  selector: 'app-pdf-viewer',
  standalone: false,
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss'
})
export class PdfViewerComponent implements OnChanges, OnDestroy {
  @Input() document: DocumentPdf | null = null;
  private readonly sanitizer = inject(DomSanitizer);
  private objectUrl = '';
  source: SafeResourceUrl | null = null;
  error = '';

  ngOnChanges(): void {
    this.release();
    this.error = '';
    if (!this.document) return;
    try {
      const binary = atob(this.document.contenu);
      if (!binary.slice(0, 1024).includes('%PDF-')) throw new Error('PDF invalide');
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
      this.objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      // La source provient exclusivement du Blob PDF créé ici.
      this.source = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
    } catch {
      this.error = 'Le contenu de ce PDF est illisible. Vous pouvez sélectionner un autre document.';
    }
  }

  ngOnDestroy(): void { this.release(); }

  private release(): void {
    this.source = null;
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = '';
  }
}
