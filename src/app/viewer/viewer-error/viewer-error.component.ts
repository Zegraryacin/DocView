import { Component, Input } from '@angular/core';
import { ViewerError } from '../models/document.models';

@Component({
  selector: 'app-viewer-error',
  standalone: false,
  templateUrl: './viewer-error.component.html',
  styleUrl: './viewer-error.component.scss'
})
export class ViewerErrorComponent {
  @Input({ required: true }) error!: ViewerError;
}
