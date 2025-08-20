import { Component } from '@angular/core';
import { UploadComponent } from './upload/upload';

@Component({
  selector: 'app-root',
  standalone: true, // Confirme que está como standalone
  imports: [UploadComponent], // Importe o UploadComponent aqui
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'frontend';
}