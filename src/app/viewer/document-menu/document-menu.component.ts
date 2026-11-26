import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DocumentPdf } from '../models/document.models';

@Component({
  selector: 'app-document-menu',
  standalone: false,
  templateUrl: './document-menu.component.html',
  styleUrl: './document-menu.component.scss'
})
export class DocumentMenuComponent {
  @Input() documents: DocumentPdf[] = [];
  @Input() selected: DocumentPdf | null = null;
  @Output() readonly documentSelected = new EventEmitter<DocumentPdf>();
}
