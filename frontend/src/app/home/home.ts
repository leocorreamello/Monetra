import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WavyBackgroundComponent } from '../components/wavy-background/wavy-background';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, WavyBackgroundComponent],
  templateUrl: './home-v2.html',
  styleUrls: ['./home-v2.css']
})
export class HomeComponent {
  constructor(private router: Router) { }
  
  goToPlanilhas() {
    this.router.navigate(['/planilhas']);
  }
}