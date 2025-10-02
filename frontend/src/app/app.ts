import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from './navigation/navigation';
import { HomeComponent } from './home/home';
import { UploadComponent } from './upload/upload';
import { GraficosComponent } from './graficos/graficos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavigationComponent,
    HomeComponent,
    UploadComponent,
    GraficosComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'Monetra';
}