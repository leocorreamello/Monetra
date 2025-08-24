import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { provideHttpClient } from '@angular/common/http'; // Adicione isso
import { importProvidersFrom } from '@angular/core'; // Para módulos, se necessário

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient() // Fornece o HttpClient globalmente
  ]
}).catch(err => console.error(err));