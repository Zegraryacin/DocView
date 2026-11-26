import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ViewerModule } from './viewer/viewer.module';
import { DOCUMENT_API_URL } from './viewer/services/document-api.service';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, ViewerModule, AppRoutingModule],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: DOCUMENT_API_URL, useFactory: () => environment.apiBack }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
