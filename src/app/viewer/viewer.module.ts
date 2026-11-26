import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewerComponent } from './viewer.component';
import { DocumentMenuComponent } from './document-menu/document-menu.component';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { ViewerErrorComponent } from './viewer-error/viewer-error.component';

@NgModule({
  declarations: [ViewerComponent, DocumentMenuComponent, PdfViewerComponent, ViewerErrorComponent],
  imports: [CommonModule],
  exports: [ViewerComponent]
})
export class ViewerModule {}
