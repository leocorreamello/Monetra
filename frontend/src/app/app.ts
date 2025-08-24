import { Component } from '@angular/core';
import { UploadComponent } from './upload/upload';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; // Adicione aqui se necessário

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UploadComponent, CommonModule, HttpClientModule], // Adicione HttpClientModule
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'frontend';
}