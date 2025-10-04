import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from '../navigation/navigation';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, NavigationComponent, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrls: ['../app.css']
})
export class MainLayoutComponent {}
